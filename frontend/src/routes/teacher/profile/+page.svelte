<script lang="ts">
  import { getContext } from "svelte";
  import type { AppUser } from "$lib/auth";
  import UserProfileOverview from "$lib/components/profile/UserProfileOverview.svelte";

  const getAppUser = getContext<() => AppUser>("appUser");

  const user = $derived(getAppUser());
</script>

<UserProfileOverview
  {user}
  title="Profil Guru"
  description="Lihat informasi akun guru yang digunakan untuk mengelola pembelajaran dan tryout."
  roleLabel="Guru"
/>
