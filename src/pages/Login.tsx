import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Hexagon, Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      const isTimeout = error.message?.toLowerCase().includes("timeout") || error.status === 504;
      toast({
        title: isTimeout ? "Servidor temporariamente indisponível" : "Erro ao entrar",
        description: isTimeout
          ? "O servidor está demorando para responder. Aguarde alguns segundos e tente novamente."
          : error.message,
        variant: "destructive",
      });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });

    if (result.error) {
      toast({
        title: "Erro ao entrar com Google",
        description: String(result.error),
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8"
      style={{ background: "#18181A" }}
    >
      {/* Background visual */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-[-120px] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(186, 117, 23, 0.10)" }}
        />
        <div
          className="absolute left-[10%] top-[18%] h-[180px] w-[180px] rounded-full blur-3xl"
          style={{ background: "rgba(250, 199, 117, 0.05)" }}
        />
        <div
          className="absolute right-[8%] bottom-[12%] h-[220px] w-[220px] rounded-full blur-3xl"
          style={{ background: "rgba(239, 159, 39, 0.06)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(250,199,117,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,199,117,0.03) 1px, transparent 1px)",
            backgroundSize: "38px 38px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center gap-3 mb-8 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <div
            className="h-11 w-11 rounded-2xl flex items-center justify-center border"
            style={{
              background: "#412402",
              borderColor: "#633806",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            }}
          >
            <Hexagon className="h-6 w-6" style={{ color: "#BA7517" }} />
          </div>

          <div className="leading-tight">
            <p
              className="text-[10px] uppercase tracking-[0.24em] m-0"
              style={{ color: "#888780" }}
            >
              plataforma financeira
            </p>
            <h1 className="text-xl font-semibold m-0" style={{ color: "#F5F5F0" }}>
              Receita<span style={{ color: "#FAC775" }}>Flow</span>
            </h1>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-[28px] p-[1px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(99,56,6,0.65) 0%, rgba(39,39,43,0.8) 35%, rgba(39,39,43,0.9) 100%)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.34)",
          }}
        >
          <div
            className="rounded-[27px] px-6 py-6 md:px-7 md:py-7"
            style={{
              background:
                "linear-gradient(180deg, rgba(28,28,31,0.96) 0%, rgba(20,20,22,0.98) 100%)",
              backdropFilter: "blur(18px)",
            }}
          >
            {/* Top badge */}
            <div className="flex items-center justify-center mb-5">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(65,36,2,0.75)",
                  border: "1px solid #633806",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#FAC775" }} />
                <span className="text-[11px] font-medium" style={{ color: "#FAC775" }}>
                  Acesso seguro à plataforma
                </span>
              </div>
            </div>

            <h2
              className="text-xl font-semibold text-center mb-1"
              style={{ color: "#F5F5F0" }}
            >
              Entrar
            </h2>
            <p
              className="text-sm text-center mb-6 leading-6"
              style={{ color: "#8D8B84" }}
            >
              Acesse sua conta para continuar no ambiente financeiro
            </p>

            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm mb-4 rounded-2xl border transition-all"
              style={{
                borderColor: "#2C2C2A",
                background: "#1B1B1E",
                color: "#D1CEC5",
              }}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Entrar com Google
            </Button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "#2C2C2A" }} />
              <span
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "#5F5E5A" }}
              >
                ou continue com email
              </span>
              <div className="flex-1 h-px" style={{ background: "#2C2C2A" }} />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium" style={{ color: "#7F7C75" }}>
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "#6E6B64" }}
                  />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl border"
                    style={{
                      borderColor: "#2C2C2A",
                      background: "#18181A",
                      color: "#D1CEC5",
                      boxShadow: "none",
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] font-medium" style={{ color: "#7F7C75" }}>
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                    style={{ color: "#6E6B64" }}
                  />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl border"
                    style={{
                      borderColor: "#2C2C2A",
                      background: "#18181A",
                      color: "#D1CEC5",
                      boxShadow: "none",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                    style={{ color: "#6E6B64" }}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div
                  className="hidden sm:flex items-center gap-2 text-[11px]"
                  style={{ color: "#6F6C66" }}
                >
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: "#BA7517" }} />
                  <span>Ambiente protegido</span>
                </div>

                <Link
                  to="/esqueci-senha"
                  className="text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: "#BA7517" }}
                >
                  Esqueci minha senha
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold rounded-2xl border-0 mt-1"
                style={{
                  background: "linear-gradient(135deg, #FAC775 0%, #EF9F27 100%)",
                  color: "#241300",
                  boxShadow: "0 12px 28px rgba(239,159,39,0.22)",
                }}
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#888780" }}>
          Acesso somente por convite
        </p>
      </motion.div>
    </div>
  );
};

export default Login;