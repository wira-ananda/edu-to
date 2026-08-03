# ============================================================
# 03_compare_attempts.R
# Perbandingan percobaan pertama dan kedua
# ============================================================

source("00_setup.R")

SUMMARY_FILE <- here(
    "analytics",
    "output",
    "tables",
    "ringkasan_siswa_percobaan.csv"
)

if (!file.exists(SUMMARY_FILE)) {
    stop(
        "Ringkasan siswa belum tersedia. ",
        "Jalankan 02_descriptive.R terlebih dahulu."
    )
}

student_summary <- readr::read_csv(
    SUMMARY_FILE,
    show_col_types = FALSE
)

# Hanya siswa yang memiliki dua percobaan lengkap

paired_data <- student_summary |>
    filter(
        completed
    ) |>
    select(
        student_key,
        student_name,
        attempt_number,
        correct_count,
        score_100,
        weighted_score_100,
        initial_level,
        final_level
    ) |>
    pivot_wider(
        names_from = attempt_number,
        values_from = c(
            correct_count,
            score_100,
            weighted_score_100,
            initial_level,
            final_level
        ),
        names_glue = "{.value}_attempt_{attempt_number}"
    ) |>
    filter(
        !is.na(score_100_attempt_1),
        !is.na(score_100_attempt_2)
    ) |>
    mutate(
        difference_correct =
            correct_count_attempt_2 -
                correct_count_attempt_1,
        difference_score =
            score_100_attempt_2 -
                score_100_attempt_1,
        difference_weighted_score =
            weighted_score_100_attempt_2 -
                weighted_score_100_attempt_1
    )

if (nrow(paired_data) < 2) {
    stop(
        "Jumlah siswa dengan dua percobaan lengkap tidak mencukupi."
    )
}

save_csv_table(
    paired_data,
    "data_perbandingan_percobaan.csv"
)

# ------------------------------------------------------------
# Fungsi effect size Wilcoxon
# ------------------------------------------------------------

paired_rank_biserial <- function(x, y) {
    difference <- x - y

    difference <- difference[
        !is.na(difference) &
            difference != 0
    ]

    if (length(difference) == 0) {
        return(NA_real_)
    }

    absolute_ranks <- rank(
        abs(difference),
        ties.method = "average"
    )

    positive_rank <- sum(
        absolute_ranks[
            difference > 0
        ]
    )

    negative_rank <- sum(
        absolute_ranks[
            difference < 0
        ]
    )

    total_rank <-
        positive_rank +
        negative_rank

    if (total_rank == 0) {
        return(NA_real_)
    }

    (
        positive_rank -
            negative_rank
    ) /
        total_rank
}

interpret_effect_size <- function(
  effect_value,
  method
) {
    absolute_effect <- abs(
        effect_value
    )

    if (is.na(absolute_effect)) {
        return(NA_character_)
    }

    if (method == "Cohen dz") {
        return(
            dplyr::case_when(
                absolute_effect < 0.20 ~
                    "Sangat kecil",
                absolute_effect < 0.50 ~
                    "Kecil",
                absolute_effect < 0.80 ~
                    "Sedang",
                TRUE ~
                    "Besar"
            )
        )
    }

    dplyr::case_when(
        absolute_effect < 0.10 ~
            "Sangat kecil",
        absolute_effect < 0.30 ~
            "Kecil",
        absolute_effect < 0.50 ~
            "Sedang",
        TRUE ~
            "Besar"
    )
}

# ------------------------------------------------------------
# Fungsi uji perbandingan berpasangan
# ------------------------------------------------------------

compare_paired_metric <- function(
  attempt_1,
  attempt_2,
  metric_name
) {
    valid <- complete.cases(
        attempt_1,
        attempt_2
    )

    x <- attempt_1[valid]
    y <- attempt_2[valid]
    difference <- y - x

    sample_size <- length(difference)

    if (sample_size < 2) {
        return(
            tibble::tibble(
                metric = metric_name,
                sample_size = sample_size,
                mean_attempt_1 = NA_real_,
                mean_attempt_2 = NA_real_,
                mean_difference = NA_real_,
                normality_p_value = NA_real_,
                test_used = NA_character_,
                statistic = NA_real_,
                p_value = NA_real_,
                effect_method = NA_character_,
                effect_size = NA_real_,
                effect_interpretation =
                    NA_character_
            )
        )
    }

    normality_p <- NA_real_

    if (
        sample_size >= 3 &&
            sample_size <= 5000 &&
            sd(difference) > 0
    ) {
        normality_p <- shapiro.test(
            difference
        )$p.value
    }

    use_t_test <-
        !is.na(normality_p) &&
            normality_p > 0.05

    if (use_t_test) {
        test_result <- t.test(
            y,
            x,
            paired = TRUE,
            alternative = "two.sided"
        )

        effect_method <- "Cohen dz"

        effect_size <- mean(
            difference
        ) /
            sd(difference)

        test_name <- "Paired t-test"
    } else {
        test_result <- suppressWarnings(
            wilcox.test(
                y,
                x,
                paired = TRUE,
                exact = FALSE,
                alternative = "two.sided"
            )
        )

        effect_method <-
            "Rank-biserial correlation"

        effect_size <-
            paired_rank_biserial(
                y,
                x
            )

        test_name <-
            "Wilcoxon signed-rank test"
    }

    tibble::tibble(
        metric = metric_name,
        sample_size = sample_size,
        mean_attempt_1 =
            mean(
                x,
                na.rm = TRUE
            ),
        mean_attempt_2 =
            mean(
                y,
                na.rm = TRUE
            ),
        mean_difference =
            mean(
                difference,
                na.rm = TRUE
            ),
        median_difference =
            median(
                difference,
                na.rm = TRUE
            ),
        normality_p_value =
            normality_p,
        test_used =
            test_name,
        statistic =
            unname(
                test_result$statistic
            ),
        p_value =
            test_result$p.value,
        effect_method =
            effect_method,
        effect_size =
            effect_size,
        effect_interpretation =
            interpret_effect_size(
                effect_size,
                effect_method
            )
    )
}

score_test <- compare_paired_metric(
    paired_data$score_100_attempt_1,
    paired_data$score_100_attempt_2,
    "Nilai tanpa bobot"
)

correct_test <- compare_paired_metric(
    paired_data$correct_count_attempt_1,
    paired_data$correct_count_attempt_2,
    "Jumlah jawaban benar"
)

weighted_test <- compare_paired_metric(
    paired_data$weighted_score_100_attempt_1,
    paired_data$weighted_score_100_attempt_2,
    "Nilai berbobot"
)

comparison_tests <- bind_rows(
    score_test,
    correct_test,
    weighted_test
)

save_csv_table(
    comparison_tests,
    "hasil_uji_perbandingan_percobaan.csv"
)

# ------------------------------------------------------------
# Ringkasan perubahan nilai
# ------------------------------------------------------------

score_change_summary <- paired_data |>
    mutate(
        change_category =
            case_when(
                difference_score > 0 ~
                    "Meningkat",
                difference_score < 0 ~
                    "Menurun",
                TRUE ~
                    "Tetap"
            )
    ) |>
    count(
        change_category,
        name = "student_count"
    ) |>
    mutate(
        percentage =
            student_count /
                sum(student_count) *
                100
    )

save_csv_table(
    score_change_summary,
    "kategori_perubahan_nilai.csv"
)

# ------------------------------------------------------------
# Perubahan tingkat akhir
# ------------------------------------------------------------

level_value <- c(
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
)

level_comparison <- paired_data |>
    mutate(
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
            case_when(
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
    count(
        level_change,
        name = "student_count"
    ) |>
    filter(
        !is.na(level_change)
    ) |>
    mutate(
        percentage =
            student_count /
                sum(student_count) *
                100
    )

save_csv_table(
    level_comparison,
    "perbandingan_level_siswa.csv"
)

save_csv_table(
    level_change_summary,
    "ringkasan_perubahan_level.csv"
)

# ------------------------------------------------------------
# Grafik perbandingan
# ------------------------------------------------------------

paired_long <- paired_data |>
    select(
        student_key,
        student_name,
        score_100_attempt_1,
        score_100_attempt_2
    ) |>
    pivot_longer(
        cols = starts_with(
            "score_100_attempt_"
        ),
        names_to = "attempt",
        values_to = "score"
    ) |>
    mutate(
        attempt = case_when(
            attempt ==
                "score_100_attempt_1" ~
                "Percobaan 1",
            attempt ==
                "score_100_attempt_2" ~
                "Percobaan 2",
            TRUE ~ attempt
        ),
        attempt = factor(
            attempt,
            levels = c(
                "Percobaan 1",
                "Percobaan 2"
            )
        )
    )

paired_line_plot <- ggplot(
    paired_long,
    aes(
        x = attempt,
        y = score,
        group = student_key
    )
) +
    geom_line(
        alpha = 0.45
    ) +
    geom_point(
        size = 2
    ) +
    labs(
        title = "Perubahan Nilai Setiap Siswa",
        x = NULL,
        y = "Nilai"
    )

save_figure(
    paired_line_plot,
    "perubahan_nilai_setiap_siswa.png"
)

difference_plot <- ggplot(
    paired_data,
    aes(
        x = difference_score
    )
) +
    geom_histogram(
        bins = 12
    ) +
    geom_vline(
        xintercept = 0,
        linetype = "dashed"
    ) +
    labs(
        title = "Distribusi Selisih Nilai",
        subtitle =
            "Nilai percobaan kedua dikurangi percobaan pertama",
        x = "Selisih Nilai",
        y = "Jumlah Siswa"
    )

save_figure(
    difference_plot,
    "distribusi_selisih_nilai.png"
)

# ------------------------------------------------------------
# Workbook perbandingan
# ------------------------------------------------------------

comparison_workbook <- list(
    Data_Berpasangan =
        paired_data,
    Hasil_Uji =
        comparison_tests,
    Perubahan_Nilai =
        score_change_summary,
    Perbandingan_Level =
        level_comparison,
    Ringkasan_Level =
        level_change_summary
)

writexl::write_xlsx(
    comparison_workbook,
    here(
        "analytics",
        "output",
        "tables",
        "hasil_perbandingan_percobaan.xlsx"
    )
)

message("================================================")
message("Perbandingan percobaan pertama dan kedua selesai.")
message("Jumlah siswa berpasangan: ", nrow(paired_data))
message("================================================")
