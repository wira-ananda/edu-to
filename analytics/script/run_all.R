# ============================================================
# run_all.R
# Membersihkan hasil lama dan menjalankan seluruh analisis
# ============================================================

CLEAN_GENERATED_OUTPUTS <- TRUE


# ============================================================
# MENENTUKAN LOKASI SCRIPT
# Bisa dijalankan dari:
# - root proyek
# - folder analytics/script
# ============================================================

original_working_directory <- getwd()

script_directory <- if (
    file.exists(
        file.path(
            "analytics",
            "script",
            "00_setup.R"
        )
    )
) {
    normalizePath(
        file.path(
            "analytics",
            "script"
        ),
        mustWork = TRUE
    )
} else if (
    file.exists("00_setup.R")
) {
    normalizePath(
        ".",
        mustWork = TRUE
    )
} else {
    stop(
        paste(
            "Folder analytics/script tidak ditemukan.",
            "Jalankan run_all.R dari root proyek",
            "atau dari folder analytics/script."
        )
    )
}

analytics_directory <- dirname(
    script_directory
)

processed_directory <- file.path(
    analytics_directory,
    "data",
    "processed"
)

raw_directory <- file.path(
    analytics_directory,
    "data",
    "raw"
)

output_directory <- file.path(
    analytics_directory,
    "output"
)

setwd(script_directory)

on.exit(
    setwd(
        original_working_directory
    ),
    add = TRUE
)


# ============================================================
# FUNGSI BANTUAN
# ============================================================

print_separator <- function(
  character = "=",
  length = 55
) {
    cat(
        paste(
            rep(
                character,
                length
            ),
            collapse = ""
        ),
        "\n"
    )
}


assert_safe_cleanup_path <- function(
  directory_path,
  expected_directory_name
) {
    normalized_path <- normalizePath(
        directory_path,
        mustWork = FALSE
    )

    actual_directory_name <- basename(
        normalized_path
    )

    if (
        actual_directory_name !=
            expected_directory_name
    ) {
        stop(
            paste0(
                "Cleanup dibatalkan karena path tidak aman: ",
                normalized_path
            )
        )
    }

    if (
        !grepl(
            paste0(
                "[/\\\\]analytics[/\\\\]"
            ),
            normalized_path
        )
    ) {
        stop(
            paste0(
                "Cleanup dibatalkan karena path bukan ",
                "bagian dari folder analytics: ",
                normalized_path
            )
        )
    }

    invisible(
        normalized_path
    )
}


remove_generated_directory <- function(
  directory_path,
  expected_directory_name
) {
    assert_safe_cleanup_path(
        directory_path,
        expected_directory_name
    )

    if (
        dir.exists(
            directory_path
        )
    ) {
        unlink(
            directory_path,
            recursive = TRUE,
            force = TRUE
        )

        cat(
            "Dibersihkan:",
            directory_path,
            "\n"
        )
    }

    dir.create(
        directory_path,
        recursive = TRUE,
        showWarnings = FALSE
    )
}


run_analysis_script <- function(
  script_path
) {
    cat("\n")
    print_separator("-")
    cat(
        "Menjalankan:",
        script_path,
        "\n"
    )
    print_separator("-")

    if (
        !file.exists(
            script_path
        )
    ) {
        stop(
            paste0(
                "File script tidak ditemukan: ",
                script_path
            )
        )
    }

    script_environment <- new.env(
        parent = globalenv()
    )

    tryCatch(
        {
            source(
                script_path,
                echo = FALSE,
                local =
                    script_environment,
                chdir = FALSE
            )

            cat(
                "\nBerhasil:",
                script_path,
                "\n"
            )
        },
        error = function(error) {
            cat("\n")
            print_separator("!")
            cat(
                "ERROR PADA:",
                script_path,
                "\n"
            )
            cat(
                "PESAN:",
                conditionMessage(error),
                "\n"
            )
            print_separator("!")

            stop(
                paste0(
                    "Proses dihentikan karena ",
                    "terjadi kesalahan pada ",
                    script_path,
                    "."
                ),
                call. = FALSE
            )
        }
    )
}


# ============================================================
# INFORMASI AWAL
# ============================================================

cat("\n")
print_separator()
cat("MEMULAI SELURUH PROSES ANALISIS\n")
print_separator()
cat("\n")

cat(
    "Folder analytics :",
    analytics_directory,
    "\n"
)

cat(
    "Folder script    :",
    script_directory,
    "\n"
)

cat(
    "Folder raw       :",
    raw_directory,
    "\n"
)


# ============================================================
# MEMBERSIHKAN HASIL GENERATE LAMA
# ============================================================

if (
    isTRUE(
        CLEAN_GENERATED_OUTPUTS
    )
) {
    cat("\n")
    print_separator("-")
    cat("MEMBERSIHKAN HASIL ANALISIS LAMA\n")
    print_separator("-")
    cat("\n")

    # Hanya menghapus hasil generate.
    # Folder data/raw tidak disentuh.

    remove_generated_directory(
        processed_directory,
        "processed"
    )

    remove_generated_directory(
        output_directory,
        "output"
    )

    dir.create(
        file.path(
            output_directory,
            "figures"
        ),
        recursive = TRUE,
        showWarnings = FALSE
    )

    dir.create(
        file.path(
            output_directory,
            "tables"
        ),
        recursive = TRUE,
        showWarnings = FALSE
    )

    cat("\n")
    cat(
        "Data raw tetap aman:",
        raw_directory,
        "\n"
    )
} else {
    cat("\n")
    cat(
        "Cleanup dilewati karena ",
        "CLEAN_GENERATED_OUTPUTS = FALSE.\n"
    )
}


# ============================================================
# DAFTAR SCRIPT ANALISIS
# ============================================================

scripts <- c(
    "00_setup.R",
    "01_import_clean.R",
    "02_descriptive.R",
    "03_compare_attempts.R",
    "04_adaptive_wrs.R",
    "05_question_classification.R",
    "06_export_results.R"
)


# ============================================================
# VALIDASI SELURUH SCRIPT TERSEDIA
# ============================================================

missing_scripts <- scripts[
    !file.exists(
        scripts
    )
]

if (
    length(
        missing_scripts
    ) > 0
) {
    stop(
        paste0(
            "Script berikut tidak ditemukan:\n- ",
            paste(
                missing_scripts,
                collapse = "\n- "
            )
        )
    )
}


# ============================================================
# MENJALANKAN SELURUH SCRIPT
# ============================================================

analysis_start_time <- Sys.time()

for (
    script_path in scripts
) {
    run_analysis_script(
        script_path
    )
}

analysis_end_time <- Sys.time()

analysis_duration <- difftime(
    analysis_end_time,
    analysis_start_time,
    units = "secs"
)


# ============================================================
# VALIDASI HASIL AKHIR
# ============================================================

final_excel_file <- file.path(
    output_directory,
    "hasil_analisis_bab_4.xlsx"
)

summary_text_file <- file.path(
    output_directory,
    "ringkasan_hasil_analisis.txt"
)

if (
    !file.exists(
        final_excel_file
    )
) {
    warning(
        paste0(
            "Workbook final belum ditemukan: ",
            final_excel_file
        )
    )
}

if (
    !file.exists(
        summary_text_file
    )
) {
    warning(
        paste0(
            "Ringkasan analisis belum ditemukan: ",
            summary_text_file
        )
    )
}


# ============================================================
# INFORMASI HASIL
# ============================================================

cat("\n")
print_separator()
cat("SELURUH ANALISIS SELESAI\n")
print_separator()
cat("\n")

cat(
    "Durasi analisis :",
    round(
        as.numeric(
            analysis_duration
        ),
        2
    ),
    "detik\n"
)

cat(
    "Hasil Excel     :",
    final_excel_file,
    "\n"
)

cat(
    "Ringkasan       :",
    summary_text_file,
    "\n"
)

cat(
    "Grafik          :",
    file.path(
        output_directory,
        "figures"
    ),
    "\n"
)

cat(
    "Tabel           :",
    file.path(
        output_directory,
        "tables"
    ),
    "\n"
)

cat(
    "Data processed  :",
    processed_directory,
    "\n"
)

cat("\n")
cat(
    "Folder data/raw tidak dihapus.\n"
)

print_separator()
