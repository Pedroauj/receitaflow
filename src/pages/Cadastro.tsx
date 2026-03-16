import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Hexagon, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Cadastro = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      navigate("/login");
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast({ title: "Erro com Google", description: String(result.error), variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#18181A" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#412402" }}>
            <Hexagon className="h-6 w-6" style={{ color: "#BA7517" }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
            Receita<span style={{ color: "#FAC775" }}>Flow</span>
          </h1>
        </div>

        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-center mb-1" style={{ color: "#F5F5F0" }}>Criar conta</h2>
          <p className="text-xs text-center mb-6" style={{ color: "#888780" }}>Cadastre-se para começar</p>

          <Button
            variant="outline"
            className="w-full h-10 text-sm border-[#2C2C2A] bg-[#1E1E20] hover:bg-[#2C2C2A] mb-4"
            style={{ color: "#B4B2A9" }}
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Cadastrar com Google
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "#2C2C2A" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "#5F5E5A" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "#2C2C2A" }} />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#5F5E5A" }} />
                <Input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 border-[#2C2C2A] bg-[#18181A] h-10" style={{ color: "#B4B2A9" }} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#5F5E5A" }} />
                <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 border-[#2C2C2A] bg-[#18181A] h-10" style={{ color: "#B4B2A9" }} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#5F5E5A" }} />
                <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 border-[#2C2C2A] bg-[#18181A] h-10" style={{ color: "#B4B2A9" }} required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#5F5E5A" }}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gradient-btn border-0 h-10 text-sm" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#888780" }}>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium hover:underline" style={{ color: "#FAC775" }}>
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Cadastro;
