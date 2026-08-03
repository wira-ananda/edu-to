# ============================================================
# run_all.R
# Menjalankan seluruh proses analisis secara berurutan
# ============================================================

cat("\n")
cat("===============================================\n")
cat("MEMULAI SELURUH PROSES ANALISIS\n")
cat("===============================================\n\n")

scripts <- c(
    "00_setup.R",
    "01_import_clean.R",
    "02_descriptive.R",
    "03_compare_attempts.R",
    "04_adaptive_wrs.R",
    "05_export_results.R"
)

for (script_path in scripts) {
    cat("\n")
    cat("-----------------------------------------------\n")
    cat("Menjalankan:", script_path, "\n")
    cat("-----------------------------------------------\n")

    tryCatch(
        {
            source(
                script_path,
                echo = FALSE
            )

            cat(
                "Berhasil:",
                script_path,
                "\n"
            )
        },
        error = function(error) {
            cat(
                "\nERROR pada:",
                script_path,
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
    "Grafik: analytics/output/figures/\n"
)
cat(
    "Tabel: analytics/output/tables/\n"
)
cat("===============================================\n")
