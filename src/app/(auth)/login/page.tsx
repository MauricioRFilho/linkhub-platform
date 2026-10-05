import LoginForm from "./LoginForm";

interface Props {
  searchParams: Promise<{ error?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const initialError = error === "auth_callback_failed"
    ? "Não foi possível confirmar o login. Solicite um novo link e tente novamente."
    : null;

  return <LoginForm initialError={initialError} />;
}
