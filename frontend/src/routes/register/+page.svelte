<script lang="ts">
  import { goto } from "$app/navigation";
  import { supabase } from "$lib/supabase";
  import { apiFetch } from "$lib/api";
  import type { AppUser } from "$lib/auth";

  type RegisterResponse = {
    ok: boolean;
    message: string;
    user: AppUser;
  };

  type MeResponse = {
    ok: boolean;
    user: AppUser;
  };

  let name = $state("");
  let email = $state("");
  let password = $state("");
  let confirmPassword = $state("");
  let school = $state("SMAN 1 Gowa");
  let className = $state("");

  let showPassword = $state(false);
  let showConfirmPassword = $state(false);

  let loading = $state(false);
  let successMessage = $state("");
  let errorMessage = $state("");

  async function handleRegister(event: SubmitEvent) {
    event.preventDefault();

    loading = true;
    successMessage = "";
    errorMessage = "";

    try {
      if (!name.trim()) {
        throw new Error("Nama wajib diisi.");
      }

      if (!email.trim()) {
        throw new Error("Email wajib diisi.");
      }

      if (password.length < 6) {
        throw new Error("Password minimal 6 karakter.");
      }

      if (password !== confirmPassword) {
        throw new Error("Konfirmasi password tidak sama.");
      }

      await apiFetch<RegisterResponse>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          name,
          email,
          password,
          school,
          className,
        }),
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error("Session tidak ditemukan setelah register.");
      }

      const result = await apiFetch<MeResponse>("/me");

      if (result.user.role === "STUDENT") {
        await goto("/student");
        return;
      }

      await goto("/login");
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Registrasi gagal.";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Daftar Siswa | EduTryout</title>
  <meta
    name="description"
    content="Daftar akun siswa untuk mengikuti tryout."
  />
</svelte:head>

<main class="min-h-screen bg-[#f5f7fb]">
  <!-- School header -->
  <header class="relative overflow-hidden bg-[#062b63]">
    <div
      class="absolute -right-20 -top-28 h-72 w-72 rotate-12 bg-[#ffca05]"
    ></div>

    <div
      class="absolute right-36 top-0 hidden h-full w-24 -skew-x-12 bg-[#0d438d] lg:block"
    ></div>

    <div
      class="relative mx-auto flex min-h-20 w-full max-w-7xl items-center px-5 sm:px-8 lg:px-10"
    >
      <a href="/login" class="inline-flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffca05] font-black text-[#062b63]"
        >
          1
        </div>

        <div class="leading-tight">
          <p
            class="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-200"
          >
            Sistem Tryout
          </p>

          <p
            class="text-lg font-black uppercase tracking-wide text-white sm:text-xl"
          >
            SMAN 1 Gowa
          </p>
        </div>
      </a>
    </div>
  </header>

  <section
    class="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center px-4 py-8 sm:px-8 sm:py-12 lg:px-10"
  >
    <div
      class="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[0.82fr_1.18fr]"
    >
      <!-- Visual panel -->
      <div
        class="relative hidden min-h-[760px] overflow-hidden bg-[#062b63] p-10 lg:flex lg:flex-col lg:justify-between"
      >
        <div
          class="absolute -left-24 top-20 h-56 w-56 rotate-[20deg] rounded-[45px] bg-[#0d438d]"
        ></div>

        <div
          class="absolute -right-32 -top-20 h-80 w-80 rotate-[18deg] rounded-[70px] bg-[#ffca05]"
        ></div>

        <div
          class="absolute bottom-0 right-0 h-72 w-72 bg-[#0a397c]"
          style="clip-path: polygon(100% 0, 100% 100%, 0 100%);"
        ></div>

        <div class="relative z-10">
          <span
            class="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100"
          >
            EduTryout
          </span>
        </div>

        <div class="relative z-10">
          <p
            class="text-sm font-bold uppercase tracking-[0.22em] text-[#ffca05]"
          >
            Akun Siswa
          </p>

          <h1
            class="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-white"
          >
            Mulai
            <br />
            perjalanan
            <br />
            belajarmu.
          </h1>

          <p class="mt-6 max-w-sm text-base leading-7 text-blue-100/80">
            Satu akun untuk mengikuti tryout, memantau percobaan, dan melihat
            perkembangan hasil belajar.
          </p>
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-3">
            <div class="h-1.5 w-14 rounded-full bg-[#ffca05]"></div>
            <div class="h-1.5 w-6 rounded-full bg-white/30"></div>
            <div class="h-1.5 w-3 rounded-full bg-white/20"></div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="px-5 py-10 sm:px-10 lg:px-14 xl:px-20 xl:py-14">
        <div class="mx-auto w-full max-w-xl">
          <div
            class="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0a397c] lg:hidden"
          >
            <span class="h-2 w-2 rounded-full bg-[#ffca05]"></span>
            EduTryout
          </div>

          <p
            class="text-xs font-bold uppercase tracking-[0.18em] text-[#0d438d]"
          >
            Registrasi siswa
          </p>

          <h2
            class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          >
            Buat akun baru
          </h2>

          <p class="mt-3 text-sm leading-6 text-slate-500">
            Lengkapi informasi berikut untuk mulai menggunakan EduTryout.
          </p>

          <form class="mt-8 space-y-5" onsubmit={handleRegister}>
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label for="name" class="text-sm font-bold text-slate-700">
                  Nama Lengkap
                </label>

                <input
                  id="name"
                  type="text"
                  bind:value={name}
                  autocomplete="name"
                  disabled={loading}
                  placeholder="Masukkan nama lengkap"
                  class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>

              <div class="sm:col-span-2">
                <label for="email" class="text-sm font-bold text-slate-700">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  bind:value={email}
                  autocomplete="email"
                  disabled={loading}
                  placeholder="nama@email.com"
                  class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label for="school" class="text-sm font-bold text-slate-700">
                  Sekolah
                </label>

                <input
                  id="school"
                  type="text"
                  bind:value={school}
                  disabled={loading}
                  placeholder="Nama sekolah"
                  class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label for="className" class="text-sm font-bold text-slate-700">
                  Kelas
                </label>

                <input
                  id="className"
                  type="text"
                  bind:value={className}
                  disabled={loading}
                  placeholder="Contoh: XII IPA 1"
                  class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>

              <div>
                <label for="password" class="text-sm font-bold text-slate-700">
                  Password
                </label>

                <div class="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    bind:value={password}
                    autocomplete="new-password"
                    disabled={loading}
                    placeholder="Minimal 6 karakter"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onclick={() => (showPassword = !showPassword)}
                    disabled={loading}
                    class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-[#0d438d] hover:bg-blue-50 disabled:opacity-60"
                  >
                    {showPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  for="confirmPassword"
                  class="text-sm font-bold text-slate-700"
                >
                  Konfirmasi Password
                </label>

                <div class="relative mt-2">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    bind:value={confirmPassword}
                    autocomplete="new-password"
                    disabled={loading}
                    placeholder="Ulangi password"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onclick={() => (showConfirmPassword = !showConfirmPassword)}
                    disabled={loading}
                    class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-[#0d438d] hover:bg-blue-50 disabled:opacity-60"
                  >
                    {showConfirmPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>
            </div>

            {#if errorMessage}
              <div
                class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
              >
                {errorMessage}
              </div>
            {/if}

            {#if successMessage}
              <div
                class="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
              >
                {successMessage}
              </div>
            {/if}

            <button
              type="submit"
              disabled={loading}
              class="group relative w-full overflow-hidden rounded-xl bg-[#063574] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082e60] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="relative z-10">
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </span>

              <span class="absolute bottom-0 left-0 h-1 w-full bg-[#ffca05]"
              ></span>
            </button>
          </form>

          <div class="my-7 flex items-center gap-4">
            <div class="h-px flex-1 bg-slate-200"></div>

            <span
              class="text-[11px] font-bold uppercase tracking-wider text-slate-400"
            >
              Sudah terdaftar
            </span>

            <div class="h-px flex-1 bg-slate-200"></div>
          </div>

          <p class="text-center text-sm text-slate-500">
            Sudah punya akun?
            <a
              href="/login"
              class="ml-1 font-bold text-[#0d438d] hover:underline"
            >
              Masuk
            </a>
          </p>
        </div>
      </div>
    </div>
  </section>
</main>
