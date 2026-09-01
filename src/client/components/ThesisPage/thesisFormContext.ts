import { createFormHookContexts, createFormHook } from '@tanstack/react-form'

const { fieldContext, formContext } = createFormHookContexts()

export const { useAppForm, useTypedAppFormContext, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
})

export const useAppFormContext = () => useTypedAppFormContext({} as any)
