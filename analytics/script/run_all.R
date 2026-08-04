# ============================================================
# run_all.R
# Menjalankan seluruh proses analisis secara berurutan
# ============================================================

SCRIPT_DIRECTORY <- if (
    dir.exists("analytics/script")
) {
    normalizePath(
        "analytics/script",
        mustWork = TRUE
    )
} else {
    normalizePath(
        ".",
        mustWork = TRUE
    )
}

get_script_path <- function(file_name) {
    file.path(
        SCRIPT_DIRECTORY,
        file_name
    )
}

cat("\n")
cat("===============================================\n")
cat("MEMULAI SELURUH PROSES ANALISIS\n")
cat("===============================================\n\n")

# Jalankan setup terlebih dahulu agar paket, here(), dan folder tersedia.
setup_file <- get_script_path(
    "00_setup.R"
)

if (!file.exists(setup_file)) {
    stop("File 00_setup.R tidak ditemukan.")
}

source(
    setup_file,
    echo = FALSE,
    chdir = TRUE
)

# ============================================================
# MEMBERSIHKAN HASIL GENERATE LAMA
# Raw data tidak pernah dihapus.
# ============================================================

remove_matching_files <- function(
  directory,
  pattern
) {
    if (!dir.exists(directory)) {
        return(invisible(NULL))
    }

    files <- list.files(
        directory,
        pattern = pattern,
        full.names = TRUE
    )

    if (length(files) > 0) {
        unlink(
            files,
            recursive = FALSE,
            force = TRUE
        )
    }

    invisible(files)
}

remove_matching_files(
    here::here(
        "analytics",
        "data",
        "processed"
    ),
    "\\.csv$"
)

remove_matching_files(
    here::here(
        "analytics",
        "output",
        "figures"
    ),
    "\\.(png|jpg|jpeg)$"
)

remove_matching_files(
    here::here(
        "analytics",
        "output",
        "tables"
    ),
    "\\.(csv|xlsx)$"
)

remove_matching_files(
    here::here(
        "analytics",
        "output"
    ),
    "^(hasil_analisis_bab_4\\.xlsx|ringkasan_hasil_analisis\\.txt)$"
)

cat("Hasil generate lama telah dibersihkan.\n")
cat("Raw data tetap aman pada analytics/data/raw.\n\n")

scripts <- c(
    "01_import_clean.R",
    "02_descriptive.R",
    "03_compare_attempts.R",
    "04_adaptive_wrs.R",
    "05_export_results.R"
)

for (script_name in scripts) {
    script_path <- get_script_path(
        script_name
    )

    cat("\n")
    cat("-----------------------------------------------\n")
    cat("Menjalankan:", script_name, "\n")
    cat("-----------------------------------------------\n")

    if (!file.exists(script_path)) {
        stop(
            "File script tidak ditemukan: ",
            script_path
        )
    }

    tryCatch(
        {
            source(
                script_path,
                echo = FALSE,
                chdir = TRUE
            )

            cat(
                "Berhasil:",
                script_name,
                "\n"
            )
        },
        error = function(error) {
            cat(
                "\nERROR pada:",
                script_name,
                "\n"
            )

            cat(
                "Pesan:",
                conditionMessage(error),
                "\n"
            )

            stop(
                "Proses dihentikan karena terjadi kesalahan."
            )
        }
    )
}

cat("\n")
cat("===============================================\n")
cat("SELURUH ANALISIS SELESAI\n")
cat("===============================================\n")
cat(
    "Hasil Excel: analytics/output/hasil_analisis_bab_4.xlsx\n"
)
cat(
    "Ringkasan: analytics/output/ringkasan_hasil_analisis.txt\n"
)
cat(
    "Grafik: analytics/output/figures/\n"
)
cat(
    "Tabel: analytics/output/tables/\n"
)
cat("===============================================\n")
