<script lang="ts">
  import { getContext } from "svelte";

  import type { AppUser } from "$lib/auth";

  import UserProfileOverview from "$lib/components/profile/UserProfileOverview.svelte";

  const getAppUser = getContext<() => AppUser>("appUser");

  const user = $derived(getAppUser());
</script>

<UserProfileOverview
  {user}
  eyebrow="Akun Siswa"
  title="Profil Siswa"
  description="Lihat informasi identitas dan data akademik yang terhubung dengan akun EduTryout."
  roleLabel="Siswa"
/>
