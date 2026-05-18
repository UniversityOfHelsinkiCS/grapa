import * as oauth from 'oauth4webapi'
import { allowInsecureRequests } from 'oauth4webapi'
import type {
  HttpRequestOptions,
  AuthorizationServer,
  Client,
  ClientAuth,
  DiscoveryRequestOptions,
  IDToken,
  UserInfoResponse,
} from 'oauth4webapi'
import passport from 'passport'

export interface OIDCConfiguration {
  issuer: URL
  algorithm: 'oidc'
  client_id: string
  client_secret: string
  redirect_uri: string
  isDevelopement: boolean
  code_challenge_method: string
}

export interface OIDCInstance {
  as: AuthorizationServer
  client: Client
  clientAuth: ClientAuth
  configuration: OIDCConfiguration
}

export interface OIDCAuthInstance {
  code_verifier: string
  authorizationUrl: URL
}

export interface OIDCUserData {
  access_token: string
  id_token: string | undefined
  claims: IDToken | undefined
  userinfo: UserInfoResponse
}

export async function init_oidc(
  configuration: OIDCConfiguration
): Promise<OIDCInstance> {
  const opts: DiscoveryRequestOptions = { algorithm: configuration.algorithm }

  if (configuration.isDevelopement) opts[allowInsecureRequests] = true

  const as = await oauth
    .discoveryRequest(configuration.issuer, opts)
    .then((response) =>
      oauth.processDiscoveryResponse(configuration.issuer, response)
    )
  const client = { client_id: configuration.client_id }
  const clientAuth = oauth.ClientSecretPost(configuration.client_secret)

  return {
    as,
    client,
    clientAuth,
    configuration,
  }
}

export async function handle_callback(
  instance: OIDCInstance,
  fullUrl: string,
  code_verifier: string
): Promise<OIDCUserData> {
  const currentUrl = new URL(fullUrl)
  const params = oauth.validateAuthResponse(
    instance.as,
    instance.client,
    currentUrl
  )

  const request_options: HttpRequestOptions<'GET'> = {}

  if (instance.configuration.isDevelopement) {
    request_options[allowInsecureRequests] = true
  }

  console.log('Starting handling callback', request_options)

  console.log('URL:', currentUrl)
  console.log('VERIFIER:', code_verifier)
  console.log('PARAMS:', params)

  throw Error('Expected error')

  const response = await oauth.authorizationCodeGrantRequest(
    instance.as,
    instance.client,
    instance.clientAuth,
    params,
    instance.configuration.redirect_uri,
    code_verifier,
    //@ts-expect-error types are similar enough
    request_options
  )

  console.log('Authorization code grant request', response)

  if (!response.ok) {
    console.log('Response fail', await response.text())
    throw Error('Server responded with an error during code grant request')
  }

  const result = await oauth.processAuthorizationCodeResponse(
    instance.as,
    instance.client,
    response,
    {
      requireIdToken: true,
    }
  )

  console.log('Processes response', result)

  const claims = oauth.getValidatedIdTokenClaims(result)
  const access_token = result['access_token']
  const id_token = result['id_token']
  const sub = claims?.sub

  console.log('Claims', claims)

  if (sub == undefined) {
    throw Error('sub field missing from claims')
  }

  const user_response = await oauth.userInfoRequest(
    instance.as,
    instance.client,
    access_token,
    request_options
  )

  console.log('Userinfo', user_response)

  const userinfo = await oauth.processUserInfoResponse(
    instance.as,
    instance.client,
    sub,
    user_response
  )

  return {
    access_token,
    id_token,
    claims,
    userinfo,
  }
}

export async function start_auth(
  instance: OIDCInstance,
  claims: object,
  scopes: string
): Promise<OIDCAuthInstance> {
  const code_verifier = oauth.generateRandomCodeVerifier()
  const code_challenge = await oauth.calculatePKCECodeChallenge(code_verifier)

  if (instance.as.authorization_endpoint == undefined) {
    throw Error('Authorization endpoint is undefined')
  }

  const authorizationUrl = new URL(instance.as.authorization_endpoint)
  authorizationUrl.searchParams.set('client_id', instance.client.client_id)
  authorizationUrl.searchParams.set(
    'redirect_uri',
    instance.configuration.redirect_uri
  )
  authorizationUrl.searchParams.set('response_type', 'code')

  if (scopes != undefined) authorizationUrl.searchParams.set('scope', scopes)

  if (claims != undefined)
    authorizationUrl.searchParams.set('claims', JSON.stringify(claims))

  authorizationUrl.searchParams.set('code_challenge', code_challenge)
  authorizationUrl.searchParams.set(
    'code_challenge_method',
    instance.configuration.code_challenge_method
  )

  return {
    code_verifier,
    authorizationUrl,
  }
}

export class liboidc_strategy extends passport.Strategy {
  name?: string
  oidc_instance: OIDCInstance
  scopes: string
  claims: object
  host: string
  verify: any

  constructor(
    oidc_instance: OIDCInstance,
    scopes: string,
    claims: object,
    host: string,
    verify: any
  ) {
    super()
    this.name = 'liboidc'
    this.oidc_instance = oidc_instance
    this.scopes = scopes
    this.claims = claims
    this.host = host
    this.verify = verify
  }

  async authenticate(
    this: passport.StrategyCreated<this, this & passport.StrategyCreatedStatic>,
    req: Request
  ) {
    if (req.session == undefined) {
      this.error(new Error('Session not defined'))
      return
    }

    const current_url: URL = new URL(
      `${req.protocol}://${this.host}${req.originalUrl}`
    )

    const is_auth_request =
      req.method === 'GET' &&
      !current_url.searchParams.has('code') &&
      !current_url.searchParams.has('error') &&
      !current_url.searchParams.has('response')

    try {
      if (is_auth_request) {
        const auth_intance = await start_auth(
          this.oidc_instance,
          this.claims,
          this.scopes
        )
        req.session.code_verifier = auth_intance.code_verifier
        this.redirect(auth_intance.authorizationUrl.href)
      } else {
        console.log('Starting callback', current_url, req.session)
        const result = await handle_callback(
          this.oidc_instance,
          current_url.href,
          req.session.code_verifier
        )
        console.log('Result', result)

        this.verify(null, result.userinfo, (error: Error, user: any) => {
          if (error != null) {
            this.error(error)
            return
          }
          if (!user) {
            this.fail()
            return
          }
          this.success(user)
        })
      }
    } catch (error) {
      console.log('OIDC authentication error: ', error)
      this.error(error)
    }
  }
}
