import { configure, defineRule } from 'vee-validate'
import * as rules from '@vee-validate/rules'

const getFirstParam = (params?: unknown[] | Record<string, unknown>) => {
  if (Array.isArray(params)) {
    return params[0]
  }

  return undefined
}

const validationMessages: Record<
  string,
  (field: string, params?: unknown[] | Record<string, unknown>) => string
> = {
  required: (field) => `${field} is required.`,
  email: (field) => `${field} must be a valid email address.`,
  min: (field, params) => `${field} must be at least ${getFirstParam(params)} characters.`,
  max: (field, params) => `${field} must be at most ${getFirstParam(params)} characters.`,
  confirmed: (field) => `${field} does not match.`,
}

let isConfigured = false

export const setupVeeValidate = () => {
  if (isConfigured) return

  Object.entries(rules).forEach(([name, rule]) => {
    if (typeof rule === 'function') {
      defineRule(name, rule as never)
    }
  })

  configure({
    validateOnBlur: true,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
    generateMessage: ({ field, rule }) => {
      const fieldName = field || 'This field'

      if (!rule?.name) {
        return `${fieldName} is invalid.`
      }

      const messageFactory = validationMessages[rule.name]

      if (messageFactory) {
        return messageFactory(fieldName, rule.params)
      }

      return `${fieldName} is invalid.`
    },
  })

  isConfigured = true
}

export { useField, useForm } from 'vee-validate'
export { object, string, number, boolean, array, mixed } from 'yup'
