# ============================================================
# 05_export_results.R
# Menggabungkan hasil analisis menjadi satu file Excel
# ============================================================

source("00_setup.R")

TABLE_DIRECTORY <- here(
    "analytics",
    "output",
    "tables"
)

FINAL_EXCEL_FILE <- here(
    "analytics",
    "output",
    "hasil_analisis_bab_4.xlsx"
)

SUMMARY_TEXT_FILE <- here(
    "analytics",
    "output",
    "ringkasan_hasil_analisis.txt"
)

# ------------------------------------------------------------
# Membaca semua CSV hasil analisis
# ------------------------------------------------------------

csv_files <- list.files(
    TABLE_DIRECTORY,
    pattern = "\\.csv$",
    full.names = TRUE
)

if (length(csv_files) == 0) {
    stop(
        "Belum ada tabel hasil analisis. ",
        "Jalankan script 01 sampai 04 terlebih dahulu."
    )
}

result_tables <- purrr::map(
    csv_files,
    function(file_path) {
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
)

raw_sheet_names <- tools::file_path_sans_ext(
    basename(csv_files)
)

# ------------------------------------------------------------
# Membersihkan nama sheet Excel
# ------------------------------------------------------------

create_sheet_names <- function(names_vector) {
    cleaned_names <- names_vector |>
        janitor::make_clean_names() |>
        stringr::str_replace_all(
            "[^A-Za-z0-9_]",
            "_"
        ) |>
        stringr::str_sub(
            1,
            27
        )

    final_names <- character(
        length(cleaned_names)
    )

    used_names <- character(0)

    for (index in seq_along(cleaned_names)) {
        current_name <- cleaned_names[index]

        if (
            current_name == "" ||
                is.na(current_name)
        ) {
            current_name <- paste0(
                "Sheet_",
                index
            )
        }

        candidate_name <- current_name
        suffix_number <- 1

        while (
            candidate_name %in%
                used_names
        ) {
            suffix_number <-
                suffix_number + 1

            candidate_name <- paste0(
                stringr::str_sub(
                    current_name,
                    1,
                    27
                ),
                "_",
                suffix_number
            )

            candidate_name <-
                stringr::str_sub(
                    candidate_name,
                    1,
                    31
                )
        }

        final_names[index] <-
            candidate_name

        used_names <- c(
            used_names,
            candidate_name
        )
    }

    final_names
}

sheet_names <- create_sheet_names(
    raw_sheet_names
)

names(result_tables) <- sheet_names

# Tambahkan daftar isi workbook

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

# ------------------------------------------------------------
# Menulis workbook final
# ------------------------------------------------------------

writexl::write_xlsx(
    result_tables,
    FINAL_EXCEL_FILE
)

message(
    "Workbook final disimpan: ",
    FINAL_EXCEL_FILE
)

# ------------------------------------------------------------
# Membuat ringkasan hasil otomatis
# ------------------------------------------------------------

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
    "Catatan pembersihan:",
    "- Data Dian Meylani Pratiwi tidak dimasukkan dalam analisis.",
    "- Respons kuesioner ganda mempertahankan pengisian terakhir.",
    "- Data asli tetap disimpan pada folder analytics/data/raw.",
    ""
)

attempt_summary_file <- here(
    "analytics",
    "output",
    "tables",
    "statistik_deskriptif_percobaan.csv"
)

if (file.exists(attempt_summary_file)) {
    attempt_summary <- readr::read_csv(
        attempt_summary_file,
        show_col_types = FALSE
    )

    summary_lines <- c(
        summary_lines,
        "STATISTIK DESKRIPTIF PERCOBAAN",
        "--------------------------------"
    )

    for (row_number in seq_len(nrow(attempt_summary))) {
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
                ", rata-rata nilai = ",
                round(
                    current_row$mean_score,
                    2
                ),
                ", median = ",
                round(
                    current_row$median_score,
                    2
                ),
                ", nilai minimum = ",
                round(
                    current_row$minimum_score,
                    2
                ),
                ", nilai maksimum = ",
                round(
                    current_row$maximum_score,
                    2
                ),
                "."
            )
        )
    }

    summary_lines <- c(
        summary_lines,
        ""
    )
}

comparison_file <- here(
    "analytics",
    "output",
    "tables",
    "hasil_uji_perbandingan_percobaan.csv"
)

if (file.exists(comparison_file)) {
    comparison_result <- readr::read_csv(
        comparison_file,
        show_col_types = FALSE
    )

    summary_lines <- c(
        summary_lines,
        "HASIL PERBANDINGAN PERCOBAAN",
        "--------------------------------"
    )

    for (
        row_number in
        seq_len(
            nrow(comparison_result)
        )
    ) {
        current_row <-
            comparison_result[
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
                round(
                    current_row$mean_attempt_1,
                    2
                ),
                ", rata-rata percobaan 2 = ",
                round(
                    current_row$mean_attempt_2,
                    2
                ),
                ", p-value = ",
                format(
                    current_row$p_value,
                    digits = 4
                ),
                ". Berdasarkan ",
                current_row$test_used,
                ", ",
                significance_text,
                ". Effect size = ",
                round(
                    current_row$effect_size,
                    3
                ),
                " (",
                current_row$effect_interpretation,
                ")."
            )
        )
    }

    summary_lines <- c(
        summary_lines,
        ""
    )
}

questionnaire_student_file <- here(
    "analytics",
    "output",
    "tables",
    "ringkasan_kuesioner_siswa.csv"
)

if (
    file.exists(
        questionnaire_student_file
    )
) {
    questionnaire_student <-
        readr::read_csv(
            questionnaire_student_file,
            show_col_types = FALSE
        )

    summary_lines <- c(
        summary_lines,
        "KUESIONER SISWA",
        "--------------------------------",
        paste0(
            "Jumlah responden siswa: ",
            questionnaire_student$total_respondents[1],
            ". Rata-rata keseluruhan: ",
            round(
                questionnaire_student$overall_mean[1],
                2
            ),
            " dengan kategori ",
            questionnaire_student$interpretation[1],
            "."
        ),
        ""
    )
}

questionnaire_teacher_file <- here(
    "analytics",
    "output",
    "tables",
    "ringkasan_kuesioner_guru.csv"
)

if (
    file.exists(
        questionnaire_teacher_file
    )
) {
    questionnaire_teacher <-
        readr::read_csv(
            questionnaire_teacher_file,
            show_col_types = FALSE
        )

    summary_lines <- c(
        summary_lines,
        "KUESIONER GURU",
        "--------------------------------",
        paste0(
            "Jumlah responden Guru: ",
            questionnaire_teacher$total_respondents[1],
            ". Rata-rata keseluruhan: ",
            round(
                questionnaire_teacher$overall_mean[1],
                2
            ),
            " dengan kategori ",
            questionnaire_teacher$interpretation[1],
            "."
        ),
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
        here(
            "analytics",
            "output",
            "figures"
        )
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
