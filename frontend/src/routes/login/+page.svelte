<script lang="ts">
  import { goto } from "$app/navigation";

  import { apiFetch } from "$lib/api";
  import { getHomePathByRole, type AppUser } from "$lib/auth";
  import { supabase } from "$lib/supabase";

  type MeResponse = {
    ok: boolean;
    user: AppUser;
  };

  let email = $state("");
  let password = $state("");
  let showPassword = $state(false);
  let loading = $state(false);
  let errorMessage = $state("");

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();

    loading = true;
    errorMessage = "";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.session) {
        throw new Error("Session tidak ditemukan.");
      }

      const result = await apiFetch<MeResponse>("/me");

      await goto(getHomePathByRole(result.user.role), {
        replaceState: true,
      });
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Login gagal.";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login | EduTryout</title>

  <meta
    name="description"
    content="Masuk ke EduTryout untuk mengakses tryout dan hasil belajar."
  />
</svelte:head>

<main class="min-h-screen bg-[#f5f7fb]">
  <!-- School Header -->
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

  <!-- Login Content -->
  <section
    class="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center px-4 py-8 sm:px-8 sm:py-12 lg:px-10"
  >
    <div
      class="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid-cols-[1.05fr_0.95fr]"
    >
      <!-- Left Visual Panel -->
      <div
        class="relative hidden min-h-[650px] overflow-hidden bg-[#062b63] p-10 lg:flex lg:flex-col lg:justify-between"
      >
        <!-- Yellow Decoration -->
        <div
          class="absolute -right-28 -top-20 h-80 w-80 rotate-[18deg] rounded-[60px] bg-[#ffca05]"
        ></div>

        <!-- Bottom Circle Decoration -->
        <div
          class="absolute -bottom-32 -left-24 h-80 w-80 rotate-[18deg] rounded-[70px] border-[36px] border-[#0d438d]"
        ></div>

        <!-- Bottom Right Decoration -->
        <div
          class="absolute bottom-0 right-0 h-60 w-60 bg-[#0a397c]"
          style="clip-path: polygon(100% 0, 100% 100%, 0 100%);"
        ></div>

        <!-- Badge -->
        <div class="relative z-10">
          <span
            class="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-100"
          >
            EduTryout
          </span>
        </div>

        <!-- Hero Content -->
        <div class="relative z-10 max-w-md">
          <p
            class="text-sm font-bold uppercase tracking-[0.22em] text-[#ffca05]"
          >
            Tryout Digital
          </p>

          <h1
            class="mt-4 text-5xl font-black leading-[1.05] tracking-tight text-white"
          >
            Belajar.
            <br />
            Berlatih.
            <br />
            Berkembang.
          </h1>

          <p class="mt-6 max-w-sm text-base leading-7 text-blue-100/80">
            Akses paket tryout, kerjakan soal, dan pantau perkembangan hasil
            belajar dalam satu platform.
          </p>
        </div>

        <!-- Indicator Decoration -->
        <div class="relative z-10 flex items-center gap-3">
          <div class="h-1.5 w-14 rounded-full bg-[#ffca05]"></div>

          <div class="h-1.5 w-6 rounded-full bg-white/30"></div>

          <div class="h-1.5 w-3 rounded-full bg-white/20"></div>
        </div>
      </div>

      <!-- Right Login Form -->
      <div
        class="flex min-h-[610px] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-[650px] lg:px-14 xl:px-20"
      >
        <div class="w-full max-w-md">
          <!-- Mobile Badge -->
          <div
            class="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0a397c] lg:hidden"
          >
            <span class="h-2 w-2 rounded-full bg-[#ffca05]"></span>

            EduTryout
          </div>

          <!-- Heading -->
          <p
            class="text-xs font-bold uppercase tracking-[0.18em] text-[#0d438d]"
          >
            Selamat datang
          </p>

          <h2
            class="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          >
            Masuk ke akunmu
          </h2>

          <p class="mt-3 text-sm leading-6 text-slate-500">
            Masukkan email dan password untuk melanjutkan ke dashboard.
          </p>

          <!-- Login Form -->
          <form class="mt-8 space-y-5" onsubmit={handleLogin}>
            <!-- Email -->
            <div>
              <label for="email" class="text-sm font-bold text-slate-700">
                Email
              </label>

              <input
                id="email"
                type="email"
                bind:value={email}
                autocomplete="email"
                placeholder="nama@email.com"
                disabled={loading}
                required
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="text-sm font-bold text-slate-700">
                Password
              </label>

              <div class="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  bind:value={password}
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                  disabled={loading}
                  required
                  class="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0d438d] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <button
                  type="button"
                  disabled={loading}
                  onclick={() => {
                    showPassword = !showPassword;
                  }}
                  class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-[#0d438d] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {showPassword ? "Sembunyi" : "Lihat"}
                </button>
              </div>
            </div>

            <!-- Error Message -->
            {#if errorMessage}
              <div
                class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
              >
                {errorMessage}
              </div>
            {/if}

            <!-- Submit -->
            <button
              type="submit"
              disabled={loading}
              class="group relative w-full overflow-hidden rounded-xl bg-[#063574] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#082e60] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span class="relative z-10">
                {loading ? "Memproses..." : "Masuk"}
              </span>

              <span class="absolute bottom-0 left-0 h-1 w-full bg-[#ffca05]"
              ></span>
            </button>
          </form>

          <!-- Divider -->
          <div class="my-7 flex items-center gap-4">
            <div class="h-px flex-1 bg-slate-200"></div>

            <span
              class="text-[11px] font-bold uppercase tracking-wider text-slate-400"
            >
              Akun baru
            </span>

            <div class="h-px flex-1 bg-slate-200"></div>
          </div>

          <!-- Register -->
          <p class="text-center text-sm text-slate-500">
            Belum punya akun?

            <a
              href="/register"
              class="ml-1 font-bold text-[#0d438d] hover:underline"
            >
              Daftar sebagai siswa
            </a>
          </p>
        </div>
      </div>
    </div>
  </section>
</main>
