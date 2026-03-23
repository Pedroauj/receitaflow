import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Hexagon, Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const APP_URL = "https://receitaflow.com";

const EsqueciSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
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
          {sent ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#412402" }}>
                <Mail className="h-6 w-6" style={{ color: "#FAC775" }} />
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: "#F5F5F0" }}>Email enviado!</h2>
              <p className="text-xs" style={{ color: "#888780" }}>
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-center mb-1" style={{ color: "#F5F5F0" }}>Esqueceu a senha?</h2>
              <p className="text-xs text-center mb-6" style={{ color: "#888780" }}>
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#5F5E5A" }} />
                    <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 border-[#2C2C2A] bg-[#18181A] h-10" style={{ color: "#B4B2A9" }} required />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-btn border-0 h-10 text-sm" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-5">
          <Link to="/login" className="font-medium hover:underline flex items-center justify-center gap-1" style={{ color: "#888780" }}>
            <ArrowLeft className="h-3 w-3" /> Voltar ao login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default EsqueciSenha;
