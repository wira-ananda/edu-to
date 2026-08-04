# ============================================================
# 03_compare_attempts.R
# Perbandingan deskriptif percobaan pertama dan kedua
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

SUMMARY_FILE <- file.path(
    TABLE_DIRECTORY,
    "ringkasan_siswa_percobaan.csv"
)

if (!file.exists(SUMMARY_FILE)) {
    stop(
        "Ringkasan siswa belum tersedia. ",
        "Jalankan 02_descriptive.R terlebih dahulu."
    )
}

# Menghapus output lama yang sudah tidak digunakan.
obsolete_files <- c(
    "hasil_uji_perbandingan_percobaan.csv"
)

unlink(
    file.path(
        TABLE_DIRECTORY,
        obsolete_files
    ),
    force = TRUE
)

student_summary <- readr::read_csv(
    SUMMARY_FILE,
    show_col_types = FALSE
) |>
    dplyr::mutate(
        attempt_number =
            as.integer(
                attempt_number
            ),
        completed =
            as.logical(
                completed
            ),
        correct_count =
            as.numeric(
                correct_count
            ),
        score_100 =
            as.numeric(
                score_100
            ),
        weighted_score_100 =
            as.numeric(
                weighted_score_100
            ),
        initial_level =
            stringr::str_to_upper(
                as.character(
                    initial_level
                )
            ),
        final_level =
            stringr::str_to_upper(
                as.character(
                    final_level
                )
            )
    )

# ============================================================
# DATA SISWA DENGAN DUA PERCOBAAN LENGKAP
# ============================================================

paired_data <- student_summary |>
    dplyr::filter(
        completed,
        attempt_number %in% c(
            1L,
            2L
        )
    ) |>
    dplyr::select(
        student_key,
        student_name,
        attempt_number,
        correct_count,
        score_100,
        weighted_score_100,
        initial_level,
        final_level
    ) |>
    tidyr::pivot_wider(
        names_from =
            attempt_number,
        values_from = c(
            correct_count,
            score_100,
            weighted_score_100,
            initial_level,
            final_level
        ),
        names_glue =
            "{.value}_attempt_{attempt_number}"
    ) |>
    dplyr::filter(
        !is.na(
            score_100_attempt_1
        ),
        !is.na(
            score_100_attempt_2
        )
    ) |>
    dplyr::mutate(
        difference_correct =
            correct_count_attempt_2 -
                correct_count_attempt_1,
        difference_score =
            score_100_attempt_2 -
                score_100_attempt_1,
        difference_weighted_score =
            weighted_score_100_attempt_2 -
                weighted_score_100_attempt_1
    ) |>
    dplyr::arrange(
        student_name
    )

if (nrow(paired_data) < 2) {
    stop(
        paste(
            "Jumlah siswa dengan dua percobaan",
            "lengkap tidak mencukupi."
        )
    )
}

save_csv_table(
    paired_data,
    "data_perbandingan_percobaan.csv"
)

# ============================================================
# PERBANDINGAN RATA-RATA SECARA DESKRIPTIF
# ============================================================

summarise_paired_metric <- function(
  attempt_1,
  attempt_2,
  metric_name
) {
    valid_index <- stats::complete.cases(
        attempt_1,
        attempt_2
    )

    first_value <-
        attempt_1[
            valid_index
        ]

    second_value <-
        attempt_2[
            valid_index
        ]

    difference_value <-
        second_value -
        first_value

    tibble::tibble(
        metric =
            metric_name,
        sample_size =
            length(
                difference_value
            ),
        mean_attempt_1 =
            mean(
                first_value,
                na.rm = TRUE
            ),
        mean_attempt_2 =
            mean(
                second_value,
                na.rm = TRUE
            ),
        mean_difference =
            mean(
                difference_value,
                na.rm = TRUE
            )
    )
}

descriptive_comparison <- dplyr::bind_rows(
    summarise_paired_metric(
        paired_data$
            score_100_attempt_1,
        paired_data$
            score_100_attempt_2,
        "Nilai tanpa bobot"
    ),
    summarise_paired_metric(
        paired_data$
            correct_count_attempt_1,
        paired_data$
            correct_count_attempt_2,
        "Jumlah jawaban benar"
    ),
    summarise_paired_metric(
        paired_data$
            weighted_score_100_attempt_1,
        paired_data$
            weighted_score_100_attempt_2,
        "Nilai berbobot"
    )
)

save_csv_table(
    descriptive_comparison,
    "perbandingan_deskriptif_percobaan.csv"
)

# ============================================================
# RINGKASAN PERUBAHAN NILAI
# ============================================================

score_change_data <- paired_data |>
    dplyr::mutate(
        change_category =
            dplyr::case_when(
                difference_score > 0 ~
                    "Meningkat",
                difference_score < 0 ~
                    "Menurun",
                TRUE ~
                    "Tetap"
            )
    )

score_change_summary <- score_change_data |>
    dplyr::count(
        change_category,
        name =
            "student_count"
    ) |>
    tidyr::complete(
        change_category = c(
            "Meningkat",
            "Menurun",
            "Tetap"
        ),
        fill = list(
            student_count = 0L
        )
    ) |>
    dplyr::mutate(
        percentage =
            student_count /
                sum(
                    student_count
                ) *
                100,
        category_order =
            match(
                change_category,
                c(
                    "Meningkat",
                    "Menurun",
                    "Tetap"
                )
            )
    ) |>
    dplyr::arrange(
        category_order
    ) |>
    dplyr::select(
        -category_order
    )

save_csv_table(
    score_change_summary,
    "kategori_perubahan_nilai.csv"
)

# ============================================================
# PERUBAHAN LEVEL AKHIR
# ============================================================

level_value <- c(
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
)

level_comparison <- paired_data |>
    dplyr::mutate(
        final_level_value_1 =
            unname(
                level_value[
                    final_level_attempt_1
                ]
            ),
        final_level_value_2 =
            unname(
                level_value[
                    final_level_attempt_2
                ]
            ),
        final_level_difference =
            final_level_value_2 -
                final_level_value_1,
        level_change =
            dplyr::case_when(
                final_level_difference > 0 ~
                    "Meningkat",
                final_level_difference < 0 ~
                    "Menurun",
                final_level_difference == 0 ~
                    "Tetap",
                TRUE ~
                    NA_character_
            )
    )

level_change_summary <- level_comparison |>
    dplyr::filter(
        !is.na(
            level_change
        )
    ) |>
    dplyr::count(
        level_change,
        name =
            "student_count"
    ) |>
    tidyr::complete(
        level_change = c(
            "Meningkat",
            "Menurun",
            "Tetap"
        ),
        fill = list(
            student_count = 0L
        )
    ) |>
    dplyr::mutate(
        percentage =
            student_count /
                sum(
                    student_count
                ) *
                100,
        category_order =
            match(
                level_change,
                c(
                    "Meningkat",
                    "Menurun",
                    "Tetap"
                )
            )
    ) |>
    dplyr::arrange(
        category_order
    ) |>
    dplyr::select(
        -category_order
    )

save_csv_table(
    level_comparison,
    "perbandingan_level_siswa.csv"
)

save_csv_table(
    level_change_summary,
    "ringkasan_perubahan_level.csv"
)

# ============================================================
# GRAFIK PERUBAHAN NILAI SETIAP SISWA
# ============================================================

paired_long <- paired_data |>
    dplyr::select(
        student_key,
        student_name,
        score_100_attempt_1,
        score_100_attempt_2
    ) |>
    tidyr::pivot_longer(
        cols =
            dplyr::starts_with(
                "score_100_attempt_"
            ),
        names_to =
            "attempt",
        values_to =
            "score"
    ) |>
    dplyr::mutate(
        attempt =
            dplyr::case_when(
                attempt ==
                    "score_100_attempt_1" ~
                    "Percobaan 1",
                attempt ==
                    "score_100_attempt_2" ~
                    "Percobaan 2",
                TRUE ~
                    attempt
            ),
        attempt =
            factor(
                attempt,
                levels = c(
                    "Percobaan 1",
                    "Percobaan 2"
                )
            )
    )

paired_line_plot <- ggplot2::ggplot(
    paired_long,
    ggplot2::aes(
        x =
            attempt,
        y =
            score,
        group =
            student_key
    )
) +
    ggplot2::geom_line(
        alpha = 0.45
    ) +
    ggplot2::geom_point(
        size = 2
    ) +
    ggplot2::labs(
        title =
            "Perubahan Nilai Setiap Siswa",
        x =
            NULL,
        y =
            "Nilai"
    )

save_figure(
    paired_line_plot,
    "perubahan_nilai_setiap_siswa.png"
)

# ============================================================
# GRAFIK DISTRIBUSI SELISIH NILAI
# ============================================================

difference_plot <- ggplot2::ggplot(
    paired_data,
    ggplot2::aes(
        x =
            difference_score
    )
) +
    ggplot2::geom_histogram(
        bins = 12
    ) +
    ggplot2::geom_vline(
        xintercept = 0,
        linetype =
            "dashed"
    ) +
    ggplot2::labs(
        title =
            "Distribusi Selisih Nilai",
        subtitle =
            paste(
                "Nilai percobaan kedua dikurangi",
                "nilai percobaan pertama"
            ),
        x =
            "Selisih Nilai",
        y =
            "Jumlah Siswa"
    )

save_figure(
    difference_plot,
    "distribusi_selisih_nilai.png"
)

# ============================================================
# WORKBOOK PERBANDINGAN DESKRIPTIF
# ============================================================

comparison_workbook <- list(
    Data_Berpasangan =
        paired_data,
    Perbandingan_Deskriptif =
        descriptive_comparison,
    Perubahan_Nilai =
        score_change_summary,
    Perbandingan_Level =
        level_comparison,
    Ringkasan_Level =
        level_change_summary
)

writexl::write_xlsx(
    comparison_workbook,
    file.path(
        TABLE_DIRECTORY,
        "hasil_perbandingan_percobaan.xlsx"
    )
)

message("")
message("================================================")
message("PERBANDINGAN DESKRIPTIF PERCOBAAN SELESAI")
message("================================================")
message(
    "Jumlah siswa dengan dua percobaan lengkap: ",
    nrow(
        paired_data
    )
)
message(
    "File ringkasan: ",
    file.path(
        TABLE_DIRECTORY,
        "perbandingan_deskriptif_percobaan.csv"
    )
)
message("================================================")
