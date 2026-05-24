import AuthPage from "../components/AuthPage";

const PartnerRegister = () => {
  return (
    <AuthPage
      role="Food partner"
      title="Join as a partner"
      description="Set up your kitchen profile and start reaching hungry customers in your area."
      buttonText="Create partner account"
      switchText="Already partnered with us?"
      switchHref="/partner/login"
      switchLinkText="Log in"
      fields={[
        {
          id: "partner-owner-name",
          name: "ownerName",
          label: "Owner name",
          type: "text",
          placeholder: "Sam Jain",
          autoComplete: "name",
        },
        {
          id: "partner-business-name",
          name: "businessName",
          label: "Business name",
          type: "text",
          placeholder: "Munchy Kitchen",
          autoComplete: "organization",
        },
        {
          id: "partner-email",
          name: "email",
          label: "Email address",
          type: "email",
          placeholder: "partner@example.com",
          autoComplete: "email",
        },
        {
          id: "partner-password",
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "Create a password",
          autoComplete: "new-password",
        },
      ]}
    />
  );
};

export default PartnerRegister;
