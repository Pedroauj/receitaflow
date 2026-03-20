import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Save, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/* ── Notification preferences (localStorage) ── */
type NotifPrefs = {
  emailProcessing: boolean;
  emailErrors: boolean;
  browserAlerts: boolean;
};

const DEFAULT_NOTIFS: NotifPrefs = {
  emailProcessing: true,
  emailErrors: true,
  browserAlerts: false,
};

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem("rf_notif_prefs");
    if (raw) return { ...DEFAULT_NOTIFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_NOTIFS;
}

function saveNotifPrefs(prefs: NotifPrefs) {
  localStorage.setItem("rf_notif_prefs", JSON.stringify(prefs));
}

/* ── Styles ── */
const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #18191D 0%, #15161A 100%)",
  border: "1px solid #22242A",
  borderRadius: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,.16)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 42,
  padding: "0 14px",
  background: "#111114",
  border: "1px solid #2C2C30",
  borderRadius: 10,
  color: "#F5F5F0",
  fontSize: 14,
  outline: "none",
  transition: "border-color .15s",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#B0B0B8",
  marginBottom: 6,
  display: "block",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#D7922B",
  color: "#111113",
  border: "none",
  borderRadius: 10,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  transition: "opacity .15s",
};

/* ── Toggle component ── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: checked ? "#D7922B" : "#2C2C30",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background .15s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#F5F5F0",
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          transition: "left .15s",
          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
        }}
      />
    </button>
  );
}

/* ── Main ── */
const Configuracoes = () => {
  const { user } = useAuth();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState<NotifPrefs>(loadNotifPrefs);
  const [notifSaved, setNotifSaved] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("full_name, display_name, email")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setDisplayName(data.display_name || "");
          setProfileEmail(data.email || user.email || "");
        }
        setProfileLoading(false);
      });
  }, [user]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        display_name: displayName.trim() || fullName.trim(),
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado com sucesso" });
    }
    setProfileSaving(false);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({ title: "Digite a nova senha", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  };

  // Save notifications
  const handleNotifChange = (key: keyof NotifPrefs, val: boolean) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    saveNotifPrefs(updated);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  return (
    <div className="w-full">
      <div className="mx-auto" style={{ maxWidth: 720 }}>
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu perfil, senha e preferências do sistema.
          </p>
        </motion.div>

        <div className="space-y-5">
          {/* ── Profile ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            style={cardStyle}
            className="p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#1E1A14",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User style={{ width: 18, height: 18, color: "#D7922B" }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F0", margin: 0 }}>
                  Perfil
                </p>
                <p style={{ fontSize: 13, color: "#7A7A82", margin: 0 }}>
                  Informações pessoais da sua conta
                </p>
              </div>
            </div>

            {profileLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Nome completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#D7922B")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#2C2C30")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nome de exibição</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Como deseja ser chamado"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#D7922B")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#2C2C30")}
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    disabled
                    style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
                  />
                  <p style={{ fontSize: 12, color: "#55555D", marginTop: 4 }}>
                    O email não pode ser alterado por aqui.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    style={{ ...btnPrimary, opacity: profileSaving ? 0.6 : 1 }}
                  >
                    {profileSaving ? (
                      <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                    ) : (
                      <Save style={{ width: 16, height: 16 }} />
                    )}
                    Salvar perfil
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Password ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={cardStyle}
            className="p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#141420",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock style={{ width: 18, height: 18, color: "#7F77DD" }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F0", margin: 0 }}>
                  Alterar senha
                </p>
                <p style={{ fontSize: 13, color: "#7A7A82", margin: 0 }}>
                  Defina uma nova senha para sua conta
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Nova senha</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#7F77DD")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#2C2C30")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6E6E76",
                      display: "flex",
                    }}
                  >
                    {showNewPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Confirmar nova senha</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#7F77DD")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#2C2C30")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#6E6E76",
                      display: "flex",
                    }}
                  >
                    {showConfirmPass ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ fontSize: 12, color: "#E24B4A", marginTop: 4 }}>
                    As senhas não coincidem.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                  style={{
                    ...btnPrimary,
                    background: "#7F77DD",
                    opacity: passwordSaving || !newPassword || newPassword !== confirmPassword ? 0.5 : 1,
                    cursor: passwordSaving || !newPassword || newPassword !== confirmPassword ? "not-allowed" : "pointer",
                  }}
                >
                  {passwordSaving ? (
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  ) : (
                    <Lock style={{ width: 16, height: 16 }} />
                  )}
                  Alterar senha
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Notifications ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            style={cardStyle}
            className="p-6"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#0F1A11",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell style={{ width: 18, height: 18, color: "#4A9D5B" }} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 16, fontWeight: 700, color: "#F5F5F0", margin: 0 }}>
                  Notificações
                </p>
                <p style={{ fontSize: 13, color: "#7A7A82", margin: 0 }}>
                  Controle os alertas e avisos do sistema
                </p>
              </div>
              {notifSaved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#4A9D5B",
                  }}
                >
                  <Check style={{ width: 14, height: 14 }} />
                  Salvo
                </motion.span>
              )}
            </div>

            <div className="space-y-1">
              {([
                {
                  key: "emailProcessing" as const,
                  label: "Conclusão de processamento",
                  desc: "Receba um aviso quando uma conciliação terminar",
                },
                {
                  key: "emailErrors" as const,
                  label: "Erros e falhas",
                  desc: "Seja notificado sobre erros durante o processamento",
                },
                {
                  key: "browserAlerts" as const,
                  label: "Alertas no navegador",
                  desc: "Exibir notificações push no navegador",
                },
              ]).map(({ key, label, desc }) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "14px 4px",
                    borderBottom: "1px solid #1E1E22",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#E2E2E7", margin: 0 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 13, color: "#6E6E76", margin: "2px 0 0" }}>{desc}</p>
                  </div>
                  <Toggle checked={notifs[key]} onChange={(val) => handleNotifChange(key, val)} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
