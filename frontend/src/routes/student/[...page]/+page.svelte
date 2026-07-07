<script lang="ts">
  import { page } from "$app/state";
  import NotAvailablePage from "$lib/components/layout/NotAvailablePage.svelte";

  const requestedPath = $derived(page.url.pathname);
</script>

<NotAvailablePage
  status="404"
  title="Halaman siswa tidak tersedia"
  description="Halaman siswa yang kamu buka belum dibuat, sudah dipindahkan, atau URL-nya tidak sesuai."
  {requestedPath}
  homeHref="/student"
  homeLabel="Kembali ke Dashboard Siswa"
/>
