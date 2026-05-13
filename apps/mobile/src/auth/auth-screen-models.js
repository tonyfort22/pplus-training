export function getAuthScreenModel({
  mode = 'sign_in',
  isSubmitting = false,
  errorMessage = '',
  noticeMessage = '',
  values = {},
} = {}) {
  const isSignUp = mode === 'sign_up'
  const isForgotPassword = mode === 'forgot_password'
  const selectedRoleId = values.role || 'athlete'
  const selectedRoleLabel = selectedRoleId === 'coach' ? 'coach' : 'athlete'

  return {
    type: 'auth',
    header: {
      eyebrow: 'PPLUS Training',
      title: isForgotPassword ? 'Reset your password' : isSignUp ? `Create your ${selectedRoleLabel} account` : `Welcome back ${selectedRoleLabel}`,
      body: isForgotPassword
        ? `Enter the email tied to your ${selectedRoleLabel} account and we’ll send a reset link.`
        : isSignUp
          ? `Build your ${selectedRoleLabel} account, connect your profile, and start pulling real training data into the shell.`
          : `Sign in to load your ${selectedRoleLabel} profile and the right app workspace.`,
    },
    roleOptions: [
      { id: 'athlete', label: 'Athlete', isDisabled: isSubmitting },
      { id: 'coach', label: 'Coach', isDisabled: isSubmitting },
    ],
    selectedRoleId,
    fields: isForgotPassword
      ? [
          { id: 'email', label: 'Email', value: values.email || '', placeholder: 'athlete@pplus.app', keyboardType: 'email-address', secureTextEntry: false, autoCapitalize: 'none', isDisabled: isSubmitting },
        ]
      : isSignUp
        ? [
            { id: 'firstName', label: 'First name', value: values.firstName || '', placeholder: 'Thomas', keyboardType: 'default', secureTextEntry: false, autoCapitalize: 'words', isDisabled: isSubmitting },
            { id: 'lastName', label: 'Last name', value: values.lastName || '', placeholder: 'Thibault', keyboardType: 'default', secureTextEntry: false, autoCapitalize: 'words', isDisabled: isSubmitting },
            ...(selectedRoleId === 'athlete'
              ? [{ id: 'coachEmail', label: 'Coach email', value: values.coachEmail || '', placeholder: 'coach@pplus.app', keyboardType: 'email-address', secureTextEntry: false, autoCapitalize: 'none', isDisabled: isSubmitting }]
              : []),
            { id: 'email', label: 'Email', value: values.email || '', placeholder: 'athlete@pplus.app', keyboardType: 'email-address', secureTextEntry: false, autoCapitalize: 'none', isDisabled: isSubmitting },
            { id: 'password', label: 'Password', value: values.password || '', placeholder: 'Create a strong password', keyboardType: 'default', secureTextEntry: true, autoCapitalize: 'none', isDisabled: isSubmitting },
            { id: 'confirmPassword', label: 'Confirm password', value: values.confirmPassword || '', placeholder: 'Confirm your password', keyboardType: 'default', secureTextEntry: true, autoCapitalize: 'none', isDisabled: isSubmitting },
          ]
        : [
            { id: 'email', label: 'Email', value: values.email || '', placeholder: 'athlete@pplus.app', keyboardType: 'email-address', secureTextEntry: false, autoCapitalize: 'none', isDisabled: isSubmitting },
            { id: 'password', label: 'Password', value: values.password || '', placeholder: 'Enter your password', keyboardType: 'default', secureTextEntry: true, autoCapitalize: 'none', isDisabled: isSubmitting },
          ],
    submitLabel: isSubmitting
      ? (isForgotPassword ? 'Sending reset link...' : isSignUp ? 'Creating account...' : 'Signing in...')
      : (isForgotPassword ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'),
    submitDisabled: isSubmitting,
    helperLabel: isForgotPassword ? 'Back to sign in' : isSignUp ? 'Already have an account? Sign in' : 'New here? Create an account',
    helperDisabled: isSubmitting,
    secondaryActionLabel: !isSignUp && !isForgotPassword ? 'Forgot password?' : null,
    secondaryActionDisabled: isSubmitting,
    errorMessage,
    noticeMessage,
  }
}
