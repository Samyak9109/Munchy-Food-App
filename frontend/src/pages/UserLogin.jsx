import AuthPage from "../components/AuthPage";

const UserLogin = () => {
  return (
    <AuthPage
      role="Customer account"
      title="Welcome back"
      description="Log in to track orders, reorder favorites, and discover fresh meals nearby."
      buttonText="Log in"
      switchText="New to Munchy?"
      switchHref="/user/register"
      switchLinkText="Create an account"
      fields={[
        {
          id: "user-login-email",
          name: "email",
          label: "Email address",
          type: "email",
          placeholder: "you@example.com",
          autoComplete: "email",
        },
        {
          id: "user-login-password",
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

export default UserLogin;
