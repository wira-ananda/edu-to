# ============================================================
# 06_export_results.R
# Menggabungkan seluruh hasil analisis menjadi satu workbook
# dan membuat ringkasan otomatis untuk Bab IV
# ============================================================

SETUP_FILE <- if (
    file.exists("analytics/script/00_setup.R")
) {
    "analytics/script/00_setup.R"
} else if (
    file.exists("00_setup.R")
) {
    "00_setup.R"
} else {
    stop("File 00_setup.R tidak ditemukan.")
}

source(SETUP_FILE)

TABLE_DIRECTORY <- here::here(
    "analytics",
    "output",
    "tables"
)

FINAL_EXCEL_FILE <- here::here(
    "analytics",
    "output",
    "hasil_analisis_bab_4.xlsx"
)

SUMMARY_TEXT_FILE <- here::here(
    "analytics",
    "output",
    "ringkasan_hasil_analisis.txt"
)

format_number <- function(
  value,
  digits = 2
) {
    if (
        length(value) == 0 ||
            is.na(value)
    ) {
        return("NA")
    }

    format(
        round(value, digits),
        nsmall = digits,
        trim = TRUE
    )
}

read_csv_safely <- function(file_path) {
    tryCatch(
        readr::read_csv(
            file_path,
            show_col_types = FALSE
        ),
        error = function(error) {
            tibble::tibble(
                error_message =
                    conditionMessage(error)
            )
        }
    )
}

create_sheet_names <- function(names_vector) {
    cleaned_names <- names_vector |>
        janitor::make_clean_names() |>
        stringr::str_replace_all(
            "[^A-Za-z0-9_]",
            "_"
        )

    final_names <- character(
        length(cleaned_names)
    )

    used_names <- character(0)

    for (index in seq_along(cleaned_names)) {
        base_name <- cleaned_names[[index]]

        if (
            is.na(base_name) ||
                base_name == ""
        ) {
            base_name <- paste0(
                "sheet_",
                index
            )
        }

        base_name <- stringr::str_sub(
            base_name,
            1,
            31
        )

        candidate_name <- base_name
        suffix_number <- 1L

        while (candidate_name %in% used_names) {
            suffix_number <-
                suffix_number + 1L

            suffix <- paste0(
                "_",
                suffix_number
            )

            candidate_name <- paste0(
                stringr::str_sub(
                    base_name,
                    1,
                    31 - nchar(suffix)
                ),
                suffix
            )
        }

        final_names[[index]] <-
            candidate_name

        used_names <- c(
            used_names,
            candidate_name
        )
    }

    final_names
}

# ============================================================
# MEMBACA SEMUA CSV HASIL ANALISIS
# ============================================================

csv_files <- list.files(
    TABLE_DIRECTORY,
    pattern = "\\.csv$",
    full.names = TRUE
) |>
    sort()

if (length(csv_files) == 0) {
    stop(
        "Belum ada tabel hasil analisis. ",
        "Jalankan script 01 sampai 04 terlebih dahulu."
    )
}

result_tables <- purrr::map(
    csv_files,
    read_csv_safely
)

raw_sheet_names <- tools::file_path_sans_ext(
    basename(csv_files)
)

sheet_names <- create_sheet_names(
    raw_sheet_names
)

names(result_tables) <- sheet_names

table_index <- tibble::tibble(
    sheet_name = sheet_names,
    source_file = basename(csv_files)
)

result_tables <- c(
    list(
        Daftar_Isi = table_index
    ),
    result_tables
)

writexl::write_xlsx(
    result_tables,
    FINAL_EXCEL_FILE
)

message(
    "Workbook final disimpan: ",
    FINAL_EXCEL_FILE
)

# ============================================================
# MEMBUAT RINGKASAN HASIL OTOMATIS
# ============================================================

summary_lines <- c(
    "RINGKASAN HASIL ANALISIS BAB IV",
    "================================",
    "",
    paste(
        "Tanggal analisis:",
        format(
            Sys.time(),
            "%d-%m-%Y %H:%M:%S"
        )
    ),
    "",
    "Sumber data:",
    paste(
        "- Tryout:",
        "tryout-biologi-kelas-10-semua-percobaan.json"
    ),
    paste(
        "- Kuesioner siswa:",
        "rekap_uji_coba_tryout_wira_lengkap.xlsx"
    ),
    "",
    "Catatan pembersihan:",
    "- Data Dian Meylani Pratiwi tidak dimasukkan dalam analisis.",
    "- Respons kuesioner ganda mempertahankan pengisian terakhir.",
    "- Respons seluruh angka 1 tetap disimpan dan tersedia dalam file audit.",
    "- Data asli tetap disimpan pada folder analytics/data/raw.",
    ""
)

metadata_file <- here::here(
    "analytics",
    "output",
    "tables",
    "metadata_tryout.csv"
)

if (file.exists(metadata_file)) {
    metadata <- read_csv_safely(
        metadata_file
    )

    if (nrow(metadata) > 0) {
        summary_lines <- c(
            summary_lines,
            "METADATA TRYOUT",
            "--------------------------------",
            paste0(
                "Judul tryout: ",
                metadata$tryout_title[[1]],
                "."
            ),
            paste0(
                "Bank soal: ",
                metadata$bank_name[[1]],
                "."
            ),
            paste0(
                "Jumlah soal per percobaan: ",
                metadata$total_questions[[1]],
                "."
            ),
            paste0(
                "Percobaan tersedia: ",
                metadata$available_attempts[[1]],
                "."
            ),
            ""
        )
    }
}

attempt_summary_file <- here::here(
    "analytics",
    "output",
    "tables",
    "statistik_deskriptif_percobaan.csv"
)

if (file.exists(attempt_summary_file)) {
    attempt_summary <- read_csv_safely(
        attempt_summary_file
    )

    summary_lines <- c(
        summary_lines,
        "STATISTIK DESKRIPTIF PERCOBAAN",
        "--------------------------------"
    )

    if (nrow(attempt_summary) > 0) {
        for (
            row_number in
            seq_len(nrow(attempt_summary))
        ) {
            current_row <- attempt_summary[
                row_number,
            ]

            summary_lines <- c(
                summary_lines,
                paste0(
                    "Percobaan ",
                    current_row$attempt_number,
                    ": jumlah siswa = ",
                    current_row$total_students,
                    ", sesi lengkap = ",
                    current_row$completed_students,
                    ", rata-rata nilai = ",
                    format_number(
                        current_row$mean_score,
                        2
                    ),
                    ", median = ",
                    format_number(
                        current_row$median_score,
                        2
                    ),
                    ", minimum = ",
                    format_number(
                        current_row$minimum_score,
                        2
                    ),
                    ", maksimum = ",
                    format_number(
                        current_row$maximum_score,
                        2
                    ),
                    ", rata-rata nilai berbobot = ",
                    format_number(
                        current_row$mean_weighted_score,
                        2
                    ),
                    "."
                )
            )
        }
    }

    summary_lines <- c(
        summary_lines,
        ""
    )
}

comparison_file <- here::here(
    "analytics",
    "output",
    "tables",
    "hasil_uji_perbandingan_percobaan.csv"
)

if (file.exists(comparison_file)) {
    comparison_result <- read_csv_safely(
        comparison_file
    )

    summary_lines <- c(
        summary_lines,
        "HASIL PERBANDINGAN PERCOBAAN",
        "--------------------------------"
    )

    if (nrow(comparison_result) > 0) {
        for (
            row_number in
            seq_len(nrow(comparison_result))
        ) {
            current_row <- comparison_result[
                row_number,
            ]

            significance_text <- if (
                !is.na(current_row$p_value) &&
                    current_row$p_value < 0.05
            ) {
                "terdapat perbedaan yang signifikan"
            } else {
                "tidak terdapat perbedaan yang signifikan"
            }

            summary_lines <- c(
                summary_lines,
                paste0(
                    current_row$metric,
                    ": rata-rata percobaan 1 = ",
                    format_number(
                        current_row$mean_attempt_1,
                        2
                    ),
                    ", rata-rata percobaan 2 = ",
                    format_number(
                        current_row$mean_attempt_2,
                        2
                    ),
                    ", selisih rata-rata = ",
                    format_number(
                        current_row$mean_difference,
                        2
                    ),
                    ", p-value = ",
                    format_number(
                        current_row$p_value,
                        4
                    ),
                    ". Berdasarkan ",
                    current_row$test_used,
                    ", ",
                    significance_text,
                    ". Effect size = ",
                    format_number(
                        current_row$effect_size,
                        3
                    ),
                    " (",
                    current_row$effect_interpretation,
                    ")."
                )
            )
        }
    }

    summary_lines <- c(
        summary_lines,
        ""
    )
}

wrs_validation_file <- here::here(
    "analytics",
    "output",
    "tables",
    "validasi_log_wrs.csv"
)

if (file.exists(wrs_validation_file)) {
    wrs_validation <- read_csv_safely(
        wrs_validation_file
    )

    if (nrow(wrs_validation) > 0) {
        current_row <- wrs_validation[1, ]

        summary_lines <- c(
            summary_lines,
            "VALIDASI LOG INTERNAL WRS",
            "--------------------------------",
            paste0(
                "Log internal tersedia: ",
                current_row$log_internal_available,
                "."
            ),
            paste0(
                "Jumlah log lengkap: ",
                current_row$complete_log_records,
                " dari ",
                current_row$total_tryout_records,
                " record (",
                format_number(
                    current_row$log_coverage_percentage,
                    2
                ),
                "%)."
            ),
            paste0(
                "Validitas jumlah kandidat: ",
                format_number(
                    current_row$valid_candidate_percentage,
                    2
                ),
                "%."
            ),
            paste0(
                "Validitas total bobot: ",
                format_number(
                    current_row$valid_total_weight_percentage,
                    2
                ),
                "%."
            ),
            paste0(
                "Validitas nilai acak: ",
                format_number(
                    current_row$valid_random_value_percentage,
                    2
                ),
                "%."
            ),
            paste0(
                "Kesesuaian level pemilihan dan kesulitan soal: ",
                format_number(
                    current_row$selected_level_match_percentage,
                    2
                ),
                "%."
            ),
            ""
        )
    }
}

questionnaire_student_file <- here::here(
    "analytics",
    "output",
    "tables",
    "ringkasan_kuesioner_siswa.csv"
)

if (file.exists(questionnaire_student_file)) {
    questionnaire_student <- read_csv_safely(
        questionnaire_student_file
    )

    if (nrow(questionnaire_student) > 0) {
        summary_lines <- c(
            summary_lines,
            "KUESIONER SISWA",
            "--------------------------------",
            paste0(
                "Jumlah responden siswa: ",
                questionnaire_student$
                    total_respondents[[1]],
                ". Rata-rata keseluruhan: ",
                format_number(
                    questionnaire_student$
                        overall_mean[[1]],
                    2
                ),
                " dengan kategori ",
                questionnaire_student$
                    interpretation[[1]],
                "."
            )
        )
    }

    reliability_file <- here::here(
        "analytics",
        "output",
        "tables",
        "reliabilitas_kuesioner_siswa.csv"
    )

    if (file.exists(reliability_file)) {
        reliability <- read_csv_safely(
            reliability_file
        )

        if (nrow(reliability) > 0) {
            summary_lines <- c(
                summary_lines,
                paste0(
                    "Cronbach's alpha: ",
                    format_number(
                        reliability$
                            cronbach_alpha[[1]],
                        3
                    ),
                    "."
                )
            )
        }
    }

    summary_lines <- c(
        summary_lines,
        ""
    )
}

summary_lines <- c(
    summary_lines,
    "FILE HASIL",
    "--------------------------------",
    paste(
        "Workbook:",
        FINAL_EXCEL_FILE
    ),
    paste(
        "Grafik:",
        here::here(
            "analytics",
            "output",
            "figures"
        )
    ),
    paste(
        "Tabel:",
        TABLE_DIRECTORY
    )
)

writeLines(
    summary_lines,
    SUMMARY_TEXT_FILE
)

message(
    "Ringkasan teks disimpan: ",
    SUMMARY_TEXT_FILE
)

message("================================================")
message("Seluruh hasil analisis berhasil diekspor.")
message("File utama: ", FINAL_EXCEL_FILE)
message("================================================")
