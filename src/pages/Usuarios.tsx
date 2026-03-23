import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Users, Shield, ShieldOff, Search, ChevronDown, ChevronRight,
  Eye, Pencil, LayoutDashboard, History, Loader2, FileSearch, Building2, Settings, Fuel, BarChart3,
  Plus, Upload, X, ImageIcon, Mail, UserPlus, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
}

interface ModulePermission {
  id: string;
  user_id: string;
  module_key: string;
  can_view: boolean;
  can_edit: boolean;
}

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "historico", label: "Histórico", icon: History },
  { key: "conciliacao", label: "NF-e / NFS-e", icon: FileSearch },
  { key: "abastecimento", label: "Abastecimento", icon: Fuel },
  { key: "medias-abastecimento", label: "Médias de Abastecimento", icon: BarChart3 },
  { key: "clientes", label: "Clientes", icon: Building2 },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];

const Usuarios = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [permLoading, setPermLoading] = useState<string | null>(null);

  // Company creation
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviting, setInviting] = useState(false);

  // Edit company
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyLogo, setEditCompanyLogo] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete company
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<"users" | "companies">("users");

  useEffect(() => {
    checkMasterAndLoad();
  }, [user]);

  const checkMasterAndLoad = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "master") {
      setIsMaster(false);
      setLoading(false);
      return;
    }
    setIsMaster(true);
    await Promise.all([loadProfiles(), loadCompanies()]);
  };

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } else {
      setProfiles((data as Profile[]) || []);
    }
    setLoading(false);
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCompanies(data || []);
  };

  const loadPermissions = async (userId: string) => {
    if (permissions[userId]) return;
    setPermLoading(userId);
    const { data, error } = await supabase
      .from("user_module_permissions")
      .select("*")
      .eq("user_id", userId);

    if (!error) {
      setPermissions((prev) => ({ ...prev, [userId]: data || [] }));
    }
    setPermLoading(null);
  };

  const toggleExpand = async (profile: Profile) => {
    if (expandedUser === profile.user_id) {
      setExpandedUser(null);
    } else {
      setExpandedUser(profile.user_id);
      await loadPermissions(profile.user_id);
    }
  };

  const togglePermission = async (
    userId: string,
    moduleKey: string,
    field: "can_view" | "can_edit",
  ) => {
    const userPerms = permissions[userId] || [];
    const existing = userPerms.find((p) => p.module_key === moduleKey);

    if (existing) {
      const newVal = !existing[field];
      const updates: Partial<ModulePermission> =
        field === "can_view" && !newVal
          ? { can_view: false, can_edit: false }
          : { [field]: newVal };

      const { error } = await supabase
        .from("user_module_permissions")
        .update(updates)
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      setPermissions((prev) => ({
        ...prev,
        [userId]: prev[userId].map((p) =>
          p.id === existing.id ? { ...p, ...updates } : p
        ),
      }));
    } else {
      const newPerm = {
        user_id: userId,
        module_key: moduleKey,
        can_view: field === "can_view",
        can_edit: field === "can_edit",
      };
      const { data, error } = await supabase
        .from("user_module_permissions")
        .insert(newPerm)
        .select()
        .single();

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
      setPermissions((prev) => ({
        ...prev,
        [userId]: [...(prev[userId] || []), data],
      }));
    }
  };

  const toggleRole = async (profile: Profile) => {
    if (profile.email === "pedraljoao5@gmail.com") return;
    setUpdating(profile.id);
    const newRole = profile.role === "master" ? "user" : "master";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p)));
      toast({ title: `Papel alterado para ${newRole === "master" ? "Admin" : "Usuário"}` });
    }
    setUpdating(null);
  };

  const toggleActive = async (profile: Profile) => {
    if (profile.email === "pedraljoao5@gmail.com") return;
    setUpdating(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ active: !profile.active })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, active: !p.active } : p))
      );
      toast({ title: profile.active ? "Usuário desativado" : "Usuário ativado" });
    }
    setUpdating(null);
  };

  const assignCompany = async (profile: Profile, companyId: string | null) => {
    setUpdating(profile.id);
    const { error } = await supabase
      .from("profiles")
      .update({ company_id: companyId || null } as any)
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, company_id: companyId } : p))
      );
      toast({ title: companyId ? "Empresa vinculada" : "Empresa removida" });
    }
    setUpdating(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewCompanyLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const createCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setCreatingCompany(true);

    let logoUrl: string | null = null;

    if (newCompanyLogo) {
      const ext = newCompanyLogo.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, newCompanyLogo);

      if (uploadError) {
        toast({ title: "Erro ao enviar logo", description: uploadError.message, variant: "destructive" });
        setCreatingCompany(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("companies")
      .insert({ name: newCompanyName.trim(), logo_url: logoUrl });

    if (error) {
      toast({ title: "Erro ao criar empresa", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Empresa criada!" });
      setNewCompanyName("");
      setNewCompanyLogo(null);
      setLogoPreview(null);
      setShowNewCompany(false);
      await loadCompanies();
    }
    setCreatingCompany(false);
  };

  const startEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
    setEditLogoPreview(company.logo_url);
    setEditCompanyLogo(null);
  };

  const handleEditLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditCompanyLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveCompany = async () => {
    if (!editingCompany || !editCompanyName.trim()) return;
    setSavingCompany(true);

    let logoUrl = editingCompany.logo_url;

    if (editCompanyLogo) {
      const ext = editCompanyLogo.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, editCompanyLogo);

      if (uploadError) {
        toast({ title: "Erro ao enviar logo", description: uploadError.message, variant: "destructive" });
        setSavingCompany(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(path);
      logoUrl = urlData.publicUrl;
    } else if (editLogoPreview === null) {
      logoUrl = null;
    }

    const { error } = await supabase
      .from("companies")
      .update({ name: editCompanyName.trim(), logo_url: logoUrl })
      .eq("id", editingCompany.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Empresa atualizada!" });
      setEditingCompany(null);
      await loadCompanies();
    }
    setSavingCompany(false);
  };

  const deleteCompany = async () => {
    if (!deletingCompany) return;
    setDeleting(true);

    // Unlink users from this company first
    const { error: unlinkError } = await supabase
      .from("profiles")
      .update({ company_id: null } as any)
      .eq("company_id", deletingCompany.id);

    if (unlinkError) {
      toast({ title: "Erro ao desvincular usuários", description: unlinkError.message, variant: "destructive" });
      setDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", deletingCompany.id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Empresa excluída!" });
      setDeletingCompany(null);
      setConfirmDeleteName("");
      await Promise.all([loadCompanies(), loadProfiles()]);
    }
    setDeleting(false);
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }
    setInviting(true);
    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: { email: inviteEmail.trim(), company_id: inviteCompany || null },
    });

    if (error || data?.error) {
      toast({
        title: "Erro ao convidar",
        description: data?.error || error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    } else {
      toast({ title: "Convite enviado!", description: `Email enviado para ${inviteEmail.trim()}` });
      setInviteEmail("");
      setInviteCompany("");
      setShowInvite(false);
      // Reload profiles after a brief delay for the trigger
      setTimeout(() => loadProfiles(), 2000);
    }
    setInviting(false);
  };

  if (isMaster === false) return <Navigate to="/dashboard" replace />;

  const filtered = profiles.filter(
    (p) =>
      (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.display_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const getPermission = (userId: string, moduleKey: string) => {
    return (permissions[userId] || []).find((p) => p.module_key === moduleKey);
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    return companies.find((c) => c.id === companyId)?.name || null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Gestão de Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie empresas, permissões e acessos dos usuários do sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 w-fit">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-3.5 w-3.5 inline mr-2" />
          Usuários
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "companies"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-3.5 w-3.5 inline mr-2" />
          Empresas
        </button>
      </div>

      {activeTab === "companies" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {companies.length} empresa{companies.length !== 1 ? "s" : ""}
            </span>
            <Button
              size="sm"
              className="gradient-btn border-0 h-8 text-xs"
              onClick={() => setShowNewCompany(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nova empresa
            </Button>
          </div>

          {/* New company form */}
          <AnimatePresence>
            {showNewCompany && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Nova empresa</h3>
                    <button onClick={() => { setShowNewCompany(false); setLogoPreview(null); setNewCompanyLogo(null); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground">Nome da empresa</Label>
                    <Input
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Ex: FinBrasil"
                      className="h-9 border-border bg-background text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground">Logo da empresa</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                    {logoPreview ? (
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-24 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                          <img src={logoPreview} alt="Preview" className="h-full object-contain" />
                        </div>
                        <button
                          onClick={() => { setNewCompanyLogo(null); setLogoPreview(null); }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 h-12 w-full rounded-lg border border-dashed border-border bg-background hover:bg-accent/30 transition-colors px-4 text-sm text-muted-foreground"
                      >
                        <Upload className="h-4 w-4" />
                        Fazer upload do logo
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="gradient-btn border-0 h-8 text-xs"
                      onClick={createCompany}
                      disabled={creatingCompany}
                    >
                      {creatingCompany ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Criando...</>
                      ) : (
                        "Criar empresa"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Companies list */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border/50">
              {companies.map((company) => {
                const userCount = profiles.filter((p) => p.company_id === company.id).length;
                return (
                  <div key={company.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors group">
                    <div className="h-10 w-10 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {userCount} usuário{userCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEditCompany(company)}
                        className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar empresa"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingCompany(company)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Excluir empresa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {companies.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Nenhuma empresa cadastrada.
                </div>
              )}
            </div>
          </div>

          {/* Edit company modal */}
          <AnimatePresence>
            {editingCompany && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                onClick={() => setEditingCompany(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Editar empresa</h3>
                    <button onClick={() => setEditingCompany(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground">Nome</Label>
                    <Input
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      className="h-9 border-border bg-background text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground">Logo</Label>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditLogoSelect}
                      className="hidden"
                    />
                    {editLogoPreview ? (
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-24 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden">
                          <img src={editLogoPreview} alt="Preview" className="h-full object-contain" />
                        </div>
                        <button
                          onClick={() => { setEditCompanyLogo(null); setEditLogoPreview(null); }}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => editFileInputRef.current?.click()}
                        className="flex items-center gap-2 h-12 w-full rounded-lg border border-dashed border-border bg-background hover:bg-accent/30 transition-colors px-4 text-sm text-muted-foreground"
                      >
                        <Upload className="h-4 w-4" />
                        Fazer upload do logo
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingCompany(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="gradient-btn border-0 h-8 text-xs"
                      onClick={saveCompany}
                      disabled={savingCompany || !editCompanyName.trim()}
                    >
                      {savingCompany ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...</> : "Salvar"}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete company confirmation modal */}
          <AnimatePresence>
            {deletingCompany && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                onClick={() => { setDeletingCompany(null); setConfirmDeleteName(""); }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full max-w-sm rounded-xl border border-border bg-card p-6 space-y-4 shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-sm font-semibold text-foreground">Excluir empresa</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Esta ação é irreversível. Todos os usuários vinculados a <span className="font-semibold text-foreground">{deletingCompany.name}</span> serão desvinculados.
                  </p>
                  <div className="space-y-2">
                    <Label className="text-[11px] text-muted-foreground">
                      Digite <span className="font-semibold text-foreground">{deletingCompany.name}</span> para confirmar
                    </Label>
                    <Input
                      value={confirmDeleteName}
                      onChange={(e) => setConfirmDeleteName(e.target.value)}
                      placeholder={deletingCompany.name}
                      className="h-9 border-border bg-background text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setDeletingCompany(null); setConfirmDeleteName(""); }}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs"
                      onClick={deleteCompany}
                      disabled={deleting || confirmDeleteName !== deletingCompany.name}
                    >
                      {deleting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Excluindo...</> : "Excluir empresa"}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {activeTab === "users" && (
        <>
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
              </span>
              <Button
                size="sm"
                className="gradient-btn border-0 h-8 text-xs"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Convidar
              </Button>
            </div>
          </div>

          {/* Invite form */}
          <AnimatePresence>
            {showInvite && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Convidar usuário
                    </h3>
                    <button onClick={() => setShowInvite(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Email do convidado</Label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        className="h-9 border-border bg-background text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Empresa (opcional)</Label>
                      <select
                        value={inviteCompany}
                        onChange={(e) => setInviteCompany(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="">Sem empresa</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      O convite será enviado via <span className="text-foreground font-medium">notify.receitaflow.com</span>
                    </p>
                    <Button
                      size="sm"
                      className="gradient-btn border-0 h-8 text-xs"
                      onClick={inviteUser}
                      disabled={inviting}
                    >
                      {inviting ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Enviando...</>
                      ) : (
                        <><Mail className="h-3.5 w-3.5 mr-1.5" /> Enviar convite</>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-border overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="w-8 px-2 py-3" />
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                        Usuário
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                        Email
                      </th>
                      <th className="text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                        Empresa
                      </th>
                      <th className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                        Papel
                      </th>
                      <th className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                        Status
                      </th>
                      <th className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground px-4 py-3">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((profile) => {
                      const isSelf = profile.email === "pedraljoao5@gmail.com";
                      const isExpanded = expandedUser === profile.user_id;
                      const initials = (profile.full_name || profile.display_name || profile.email || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <>
                          <tr
                            key={profile.id}
                            className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors duration-150"
                          >
                            <td className="px-2 py-3">
                              <button
                                type="button"
                                onClick={() => toggleExpand(profile)}
                                className="flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-[11px] font-semibold text-primary">
                                  {initials}
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                  {profile.full_name || profile.display_name || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {profile.email || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={profile.company_id || ""}
                                onChange={(e) => assignCompany(profile, e.target.value || null)}
                                disabled={updating === profile.id}
                                className="h-7 px-2 rounded-md text-[11px] border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50 max-w-[140px]"
                              >
                                <option value="">Sem empresa</option>
                                {companies.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                                  profile.role === "master"
                                    ? "bg-primary/15 text-primary"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {profile.role === "master" ? (
                                  <Shield className="h-3 w-3" />
                                ) : (
                                  <Users className="h-3 w-3" />
                                )}
                                {profile.role === "master" ? "Admin" : "Usuário"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-medium ${
                                  profile.active
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : "bg-red-500/15 text-red-400"
                                }`}
                              >
                                {profile.active ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isSelf ? (
                                <span className="text-[11px] text-muted-foreground/50 flex justify-center">
                                  Protegido
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleRole(profile)}
                                    disabled={updating === profile.id}
                                    className="h-7 px-2.5 rounded-md text-[11px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                                    title={
                                      profile.role === "master"
                                        ? "Rebaixar para Usuário"
                                        : "Promover a Admin"
                                    }
                                  >
                                    {profile.role === "master" ? (
                                      <ShieldOff className="h-3.5 w-3.5" />
                                    ) : (
                                      <Shield className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleActive(profile)}
                                    disabled={updating === profile.id}
                                    className={`h-7 px-2.5 rounded-md text-[11px] font-medium border transition-colors disabled:opacity-50 ${
                                      profile.active
                                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    }`}
                                  >
                                    {profile.active ? "Desativar" : "Ativar"}
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>

                          {/* Permissions panel */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr key={`perm-${profile.id}`}>
                                <td colSpan={7} className="p-0">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-6 py-4 bg-muted/20 border-b border-border/50">
                                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                                        Permissões por módulo
                                      </p>

                                      {permLoading === profile.user_id ? (
                                        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                          Carregando...
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {MODULES.map((mod) => {
                                            const perm = getPermission(profile.user_id, mod.key);
                                            const canView = perm?.can_view ?? false;
                                            const canEdit = perm?.can_edit ?? false;

                                            return (
                                              <div
                                                key={mod.key}
                                                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card"
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                  <mod.icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                  <span className="text-[12px] font-medium text-foreground truncate">
                                                    {mod.label}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      togglePermission(profile.user_id, mod.key, "can_view")
                                                    }
                                                    className={`flex items-center gap-1 h-6 px-2 rounded text-[10px] font-medium transition-colors ${
                                                      canView
                                                        ? "bg-primary/15 text-primary"
                                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                    }`}
                                                    title="Visualizar"
                                                  >
                                                    <Eye className="h-3 w-3" />
                                                    Ver
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      togglePermission(profile.user_id, mod.key, "can_edit")
                                                    }
                                                    disabled={!canView}
                                                    className={`flex items-center gap-1 h-6 px-2 rounded text-[10px] font-medium transition-colors disabled:opacity-30 ${
                                                      canEdit
                                                        ? "bg-emerald-500/15 text-emerald-400"
                                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                                    }`}
                                                    title="Editar"
                                                  >
                                                    <Pencil className="h-3 w-3" />
                                                    Editar
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Usuarios;
