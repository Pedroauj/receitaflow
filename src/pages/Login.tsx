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

  const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

  setLoading(false);

  if (error) {
    toast({
      title: "Erro ao entrar",
      description: error.message,
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0C0F] px-4 py-8 text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 18% 12%, rgba(255,255,255,0.04), transparent 22%),
            radial-gradient(circle at 82% 78%, rgba(120,146,255,0.10), transparent 28%),
            radial-gradient(circle at 50% 0%, rgba(255,255,255,0.025), transparent 28%),
            linear-gradient(180deg, #0B0C0F 0%, #0A0B0E 100%)
          `,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="mb-8 flex cursor-pointer select-none items-center justify-center gap-3"
          onClick={() => navigate("/")}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "rgba(95, 135, 255, 0.20)",
              background:
                "linear-gradient(180deg, rgba(70,95,180,0.22) 0%, rgba(45,58,108,0.18) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <Hexagon className="h-6 w-6 text-[#9CB2FF]" />
          </div>

          <div className="leading-tight">
            <p className="m-0 text-[10px] uppercase tracking-[0.24em] text-white/30">
              plataforma operacional
            </p>
            <h1 className="m-0 text-xl font-semibold tracking-[-0.03em] text-white">
              Receita<span className="text-[#8EA6FF]">Flow</span>
            </h1>
          </div>
        </div>

        <div
          className="rounded-[30px] border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.34)] md:p-7"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(18,20,26,0.96) 0%, rgba(14,16,21,0.98) 100%)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="mb-5 flex items-center justify-center">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
              style={{
                borderColor: "rgba(142,166,255,0.14)",
                background: "rgba(142,166,255,0.08)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#B9C7FF]" />
              <span className="text-[11px] font-medium text-[#B9C7FF]">
                Acesso seguro à plataforma
              </span>
            </div>
          </div>

          <h2 className="mb-1 text-center text-xl font-semibold text-white">Entrar</h2>
          <p className="mb-6 text-center text-sm leading-6 text-white/44">
            Acesse sua conta para continuar no ambiente financeiro
          </p>

          <Button
            type="button"
            variant="outline"
            className="mb-4 h-11 w-full rounded-2xl border text-sm transition-all"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.025)",
              color: "rgba(255,255,255,0.78)",
            }}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/24">
              ou continue com email
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-white/42">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border pl-10"
                  style={{
                    borderColor: "rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.02)",
                    color: "#E7EBF5",
                    boxShadow: "none",
                  }}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-white/42">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl border pl-10 pr-10"
                  style={{
                    borderColor: "rgba(255,255,255,0.07)",
                    background: "rgba(255,255,255,0.02)",
                    color: "#E7EBF5",
                    boxShadow: "none",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-opacity hover:opacity-80"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="hidden items-center gap-2 text-[11px] text-white/34 sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-[#8EA6FF]" />
                <span>Ambiente protegido</span>
              </div>

              <Link
                to="/esqueci-senha"
                className="text-[11px] font-medium text-[#8EA6FF] transition-colors hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button
              type="submit"
              className="mt-1 h-11 w-full rounded-2xl border-0 text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, #9CB2FF 0%, #6E8CFF 100%)",
                color: "#0E1324",
                boxShadow: "0 12px 28px rgba(110,140,255,0.22)",
              }}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-white/28">Acesso somente por convite</p>
      </motion.div>
    </div>
  );
};

export default Login;