<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { getCurrentUser } from "$lib/auth";
  import NotAvailablePage from "$lib/components/layout/NotAvailablePage.svelte";

  let homeHref = $state("/login");
  let homeLabel = $state("Kembali ke Login");

  const status = $derived(String(page.status ?? 500));

  const title = $derived(
    page.status === 404
      ? "Halaman tidak tersedia"
      : page.status === 401
        ? "Akses tidak valid"
        : page.status === 403
          ? "Akses ditolak"
          : "Terjadi kesalahan",
  );

  const description = $derived(
    page.status === 404
      ? "Halaman yang kamu buka tidak ditemukan. Periksa kembali URL atau kembali ke halaman utama."
      : (page.error?.message ?? "Terjadi kesalahan pada aplikasi."),
  );

  const requestedPath = $derived(page.url.pathname);

  onMount(async () => {
    try {
      const user = await getCurrentUser();

      if (!user) {
        homeHref = "/login";
        homeLabel = "Kembali ke Login";
        return;
      }

      if (user.role === "ADMIN") {
        homeHref = "/admin";
        homeLabel = "Kembali ke Dashboard Admin";
        return;
      }

      homeHref = "/student";
      homeLabel = "Kembali ke Dashboard Siswa";
    } catch {
      homeHref = "/login";
      homeLabel = "Kembali ke Login";
    }
  });
</script>

<main class="min-h-screen bg-slate-50 px-6 py-10">
  <NotAvailablePage
    {status}
    {title}
    {description}
    {requestedPath}
    {homeHref}
    {homeLabel}
  />
</main>
