import InvalidTokenOrMissingPage from "./components/InvalidTokenOrMissingPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import { AuthService } from "@/modules/services/AuthService";

interface PageProps {
  searchParams?: { token?: string };
}

const authService = new AuthService();

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params?.token;

  if (!token) {
    return <InvalidTokenOrMissingPage />;
  }

  try {
    await authService.ForgotPasswordTokenVerify({ token });

    return <ForgotPasswordPage token={token} />;
  } catch (error) {
    console.error("Error verifying token:", error);
    return <InvalidTokenOrMissingPage />;
  }
}
