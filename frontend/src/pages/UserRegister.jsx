import AuthPage from "../components/AuthPage";

const UserRegister = () => {
  return (
    <AuthPage
      role="Customer account"
      title="Create your account"
      description="Order from nearby kitchens and keep your favorites ready for next time."
      buttonText="Create account"
      switchText="Already have an account?"
      switchHref="/user/login"
      switchLinkText="Log in"
      fields={[
        {
          id: "user-name",
          name: "name",
          label: "Full name",
          type: "text",
          placeholder: "Sam Jain",
          autoComplete: "name",
        },
        {
          id: "user-email",
          name: "email",
          label: "Email address",
          type: "email",
          placeholder: "you@example.com",
          autoComplete: "email",
        },
        {
          id: "user-password",
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

export default UserRegister;
