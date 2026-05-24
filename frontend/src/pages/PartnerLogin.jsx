import AuthPage from "../components/AuthPage";

const PartnerLogin = () => {
  return (
    <AuthPage
      role="Food partner"
      title="Partner login"
      description="Access your orders, menu, and kitchen dashboard from one clean workspace."
      buttonText="Log in"
      switchText="Want to sell on Munchy?"
      switchHref="/partner/register"
      switchLinkText="Create partner account"
      fields={[
        {
          id: "partner-login-email",
          name: "email",
          label: "Email address",
          type: "email",
          placeholder: "partner@example.com",
          autoComplete: "email",
        },
        {
          id: "partner-login-password",
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
          autoComplete: "current-password",
        },
      ]}
    />
  );
};

export default PartnerLogin;
