# ============================================================
# 02_descriptive.R
# Statistik deskriptif data tryout dan kuesioner
# ============================================================

source("00_setup.R")

TOTAL_QUESTIONS <- 15

TRYOUT_CLEAN_FILE <- here(
    "analytics",
    "data",
    "processed",
    "tryout_clean.csv"
)

if (!file.exists(TRYOUT_CLEAN_FILE)) {
    stop(
        "Data tryout bersih belum tersedia. ",
        "Jalankan 01_import_clean.R terlebih dahulu."
    )
}

tryout_data <- readr::read_csv(
    TRYOUT_CLEAN_FILE,
    show_col_types = FALSE
)

tryout_data <- tryout_data |>
    mutate(
        is_correct = as.logical(is_correct),
        attempt_number = as.integer(attempt_number),
        question_number = as.integer(question_number),
        weight = as.numeric(weight)
    )

# ------------------------------------------------------------
# Ringkasan setiap siswa dan percobaan
# ------------------------------------------------------------

student_attempt_summary <- tryout_data |>
    group_by(
        student_key,
        student_id,
        student_name,
        attempt_number
    ) |>
    summarise(
        initial_level = first(
            initial_level[
                !is.na(initial_level)
            ],
            default = NA_character_
        ),
        final_level = first(
            final_level[
                !is.na(final_level)
            ],
            default = NA_character_
        ),
        total_questions =
            n_distinct(question_number),
        correct_count =
            sum(
                is_correct %in% TRUE,
                na.rm = TRUE
            ),
        wrong_count =
            sum(
                is_correct %in% FALSE,
                na.rm = TRUE
            ),
        unanswered_count =
            sum(
                is.na(is_correct)
            ),
        total_weight =
            sum(
                weight,
                na.rm = TRUE
            ),
        weighted_correct =
            sum(
                weight *
                    as.integer(is_correct %in% TRUE),
                na.rm = TRUE
            ),
        .groups = "drop"
    ) |>
    mutate(
        completed =
            total_questions >= TOTAL_QUESTIONS,
        accuracy_percent =
            dplyr::if_else(
                total_questions > 0,
                correct_count /
                    total_questions *
                    100,
                NA_real_
            ),
        score_100 =
            accuracy_percent,
        weighted_score_100 =
            dplyr::if_else(
                total_weight > 0,
                weighted_correct /
                    total_weight *
                    100,
                NA_real_
            )
    )

save_csv_table(
    student_attempt_summary,
    "ringkasan_siswa_percobaan.csv"
)

# ------------------------------------------------------------
# Ringkasan berdasarkan percobaan
# ------------------------------------------------------------

attempt_summary <- student_attempt_summary |>
    group_by(
        attempt_number
    ) |>
    summarise(
        total_students =
            n_distinct(student_key),
        completed_students =
            sum(completed),
        mean_correct =
            mean(
                correct_count,
                na.rm = TRUE
            ),
        sd_correct =
            sd(
                correct_count,
                na.rm = TRUE
            ),
        median_correct =
            median(
                correct_count,
                na.rm = TRUE
            ),
        minimum_correct =
            min(
                correct_count,
                na.rm = TRUE
            ),
        maximum_correct =
            max(
                correct_count,
                na.rm = TRUE
            ),
        mean_score =
            mean(
                score_100,
                na.rm = TRUE
            ),
        sd_score =
            sd(
                score_100,
                na.rm = TRUE
            ),
        median_score =
            median(
                score_100,
                na.rm = TRUE
            ),
        minimum_score =
            min(
                score_100,
                na.rm = TRUE
            ),
        maximum_score =
            max(
                score_100,
                na.rm = TRUE
            ),
        mean_weighted_score =
            mean(
                weighted_score_100,
                na.rm = TRUE
            ),
        sd_weighted_score =
            sd(
                weighted_score_100,
                na.rm = TRUE
            ),
        .groups = "drop"
    )

save_csv_table(
    attempt_summary,
    "statistik_deskriptif_percobaan.csv"
)

# ------------------------------------------------------------
# Distribusi tingkat kesulitan
# ------------------------------------------------------------

difficulty_distribution <- tryout_data |>
    count(
        attempt_number,
        difficulty,
        name = "question_count"
    ) |>
    group_by(
        attempt_number
    ) |>
    mutate(
        percentage =
            question_count /
                sum(question_count) *
                100
    ) |>
    ungroup()

save_csv_table(
    difficulty_distribution,
    "distribusi_tingkat_kesulitan.csv"
)

difficulty_accuracy <- tryout_data |>
    group_by(
        attempt_number,
        difficulty
    ) |>
    summarise(
        total_answers = n(),
        correct_answers =
            sum(
                is_correct %in% TRUE,
                na.rm = TRUE
            ),
        wrong_answers =
            sum(
                is_correct %in% FALSE,
                na.rm = TRUE
            ),
        accuracy_percent =
            mean(
                is_correct,
                na.rm = TRUE
            ) *
                100,
        .groups = "drop"
    )

save_csv_table(
    difficulty_accuracy,
    "akurasi_berdasarkan_kesulitan.csv"
)

# ------------------------------------------------------------
# Distribusi bobot
# ------------------------------------------------------------

weight_distribution <- tryout_data |>
    count(
        attempt_number,
        weight,
        name = "selection_count"
    ) |>
    group_by(
        attempt_number
    ) |>
    mutate(
        percentage =
            selection_count /
                sum(selection_count) *
                100
    ) |>
    ungroup()

save_csv_table(
    weight_distribution,
    "distribusi_bobot_soal.csv"
)

weight_accuracy <- tryout_data |>
    group_by(
        attempt_number,
        weight
    ) |>
    summarise(
        total_answers = n(),
        accuracy_percent =
            mean(
                is_correct,
                na.rm = TRUE
            ) *
                100,
        .groups = "drop"
    )

save_csv_table(
    weight_accuracy,
    "akurasi_berdasarkan_bobot.csv"
)

# ------------------------------------------------------------
# Statistik berdasarkan nomor soal
# ------------------------------------------------------------

position_summary <- tryout_data |>
    group_by(
        attempt_number,
        question_number
    ) |>
    summarise(
        total_students =
            n_distinct(student_key),
        unique_questions =
            n_distinct(question_id),
        correct_count =
            sum(
                is_correct %in% TRUE,
                na.rm = TRUE
            ),
        wrong_count =
            sum(
                is_correct %in% FALSE,
                na.rm = TRUE
            ),
        accuracy_percent =
            mean(
                is_correct,
                na.rm = TRUE
            ) *
                100,
        mean_weight =
            mean(
                weight,
                na.rm = TRUE
            ),
        .groups = "drop"
    )

save_csv_table(
    position_summary,
    "ringkasan_berdasarkan_nomor_soal.csv"
)

position_difficulty <- tryout_data |>
    count(
        attempt_number,
        question_number,
        difficulty,
        name = "question_count"
    ) |>
    group_by(
        attempt_number,
        question_number
    ) |>
    mutate(
        percentage =
            question_count /
                sum(question_count) *
                100
    ) |>
    ungroup()

save_csv_table(
    position_difficulty,
    "kesulitan_berdasarkan_nomor_soal.csv"
)

# ------------------------------------------------------------
# Perubahan tingkat awal dan akhir
# ------------------------------------------------------------

level_transitions <- student_attempt_summary |>
    count(
        attempt_number,
        initial_level,
        final_level,
        name = "student_count"
    ) |>
    group_by(
        attempt_number
    ) |>
    mutate(
        percentage =
            student_count /
                sum(student_count) *
                100
    ) |>
    ungroup()

save_csv_table(
    level_transitions,
    "perubahan_level_awal_akhir.csv"
)

# ------------------------------------------------------------
# Grafik tryout
# ------------------------------------------------------------

score_boxplot <- ggplot(
    student_attempt_summary,
    aes(
        x = factor(attempt_number),
        y = score_100
    )
) +
    geom_boxplot() +
    geom_jitter(
        width = 0.12,
        alpha = 0.60
    ) +
    labs(
        title = "Distribusi Nilai Berdasarkan Percobaan",
        x = "Percobaan",
        y = "Nilai"
    )

save_figure(
    score_boxplot,
    "distribusi_nilai_percobaan.png"
)

difficulty_plot <- ggplot(
    difficulty_distribution,
    aes(
        x = factor(attempt_number),
        y = percentage,
        fill = difficulty
    )
) +
    geom_col(
        position = "dodge"
    ) +
    labs(
        title = "Distribusi Tingkat Kesulitan Soal",
        x = "Percobaan",
        y = "Persentase",
        fill = "Kesulitan"
    ) +
    scale_y_continuous(
        labels = function(x) {
            paste0(
                round(x, 1),
                "%"
            )
        }
    )

save_figure(
    difficulty_plot,
    "distribusi_tingkat_kesulitan.png"
)

position_accuracy_plot <- ggplot(
    position_summary,
    aes(
        x = question_number,
        y = accuracy_percent,
        group = factor(attempt_number),
        linetype = factor(attempt_number)
    )
) +
    geom_line(
        linewidth = 1
    ) +
    geom_point(
        size = 2
    ) +
    scale_x_continuous(
        breaks = 1:15
    ) +
    labs(
        title = "Akurasi Jawaban Berdasarkan Nomor Soal",
        x = "Nomor Soal",
        y = "Akurasi",
        linetype = "Percobaan"
    )

save_figure(
    position_accuracy_plot,
    "akurasi_berdasarkan_nomor_soal.png"
)

# ------------------------------------------------------------
# Fungsi statistik kuesioner
# ------------------------------------------------------------

interpret_likert <- function(value) {
    dplyr::case_when(
        is.na(value) ~ NA_character_,
        value <= 1.80 ~ "Sangat Rendah",
        value <= 2.60 ~ "Rendah",
        value <= 3.40 ~ "Sedang",
        value <= 4.20 ~ "Tinggi",
        TRUE ~ "Sangat Tinggi"
    )
}

analyse_questionnaire <- function(
  file_path,
  respondent_type
) {
    if (!file.exists(file_path)) {
        message(
            "Data kuesioner ",
            respondent_type,
            " tidak ditemukan dan dilewati."
        )

        return(NULL)
    }

    data <- readr::read_csv(
        file_path,
        show_col_types = FALSE
    )

    item_columns <- names(data)[
        stringr::str_detect(
            names(data),
            "^item_"
        )
    ]

    if (length(item_columns) == 0) {
        message(
            "Tidak ada item kuesioner untuk ",
            respondent_type
        )

        return(NULL)
    }

    item_statistics <- data |>
        select(
            all_of(item_columns)
        ) |>
        pivot_longer(
            cols = everything(),
            names_to = "item",
            values_to = "score"
        ) |>
        group_by(
            item
        ) |>
        summarise(
            total_responses =
                sum(!is.na(score)),
            mean_score =
                mean(
                    score,
                    na.rm = TRUE
                ),
            sd_score =
                sd(
                    score,
                    na.rm = TRUE
                ),
            median_score =
                median(
                    score,
                    na.rm = TRUE
                ),
            negative_percent =
                mean(
                    score <= 2,
                    na.rm = TRUE
                ) *
                    100,
            neutral_percent =
                mean(
                    score == 3,
                    na.rm = TRUE
                ) *
                    100,
            positive_percent =
                mean(
                    score >= 4,
                    na.rm = TRUE
                ) *
                    100,
            .groups = "drop"
        ) |>
        mutate(
            interpretation =
                interpret_likert(mean_score)
        )

    respondent_statistics <- data |>
        rowwise() |>
        mutate(
            mean_score =
                mean(
                    c_across(
                        all_of(item_columns)
                    ),
                    na.rm = TRUE
                ),
            total_score =
                sum(
                    c_across(
                        all_of(item_columns)
                    ),
                    na.rm = TRUE
                )
        ) |>
        ungroup() |>
        mutate(
            interpretation =
                interpret_likert(mean_score)
        )

    overall_statistics <- tibble::tibble(
        respondent_type = respondent_type,
        total_respondents = nrow(data),
        total_items = length(item_columns),
        overall_mean = mean(
            as.matrix(
                data[item_columns]
            ),
            na.rm = TRUE
        ),
        overall_sd = sd(
            unlist(
                data[item_columns]
            ),
            na.rm = TRUE
        )
    ) |>
        mutate(
            interpretation =
                interpret_likert(overall_mean)
        )

    non_constant_items <- item_columns[
        vapply(
            data[item_columns],
            function(x) {
                valid_values <- x[
                    !is.na(x)
                ]

                length(
                    unique(valid_values)
                ) > 1
            },
            logical(1)
        )
    ]

    reliability_result <- tibble::tibble(
        respondent_type = respondent_type,
        total_respondents = nrow(data),
        total_items_used =
            length(non_constant_items),
        cronbach_alpha = NA_real_
    )

    if (
        nrow(data) >= 2 &&
            length(non_constant_items) >= 2
    ) {
        alpha_result <- tryCatch(
            suppressWarnings(
                psych::alpha(
                    data[
                        non_constant_items
                    ],
                    check.keys = FALSE
                )
            ),
            error = function(error) {
                NULL
            }
        )

        if (!is.null(alpha_result)) {
            reliability_result$cronbach_alpha <-
                alpha_result$total$raw_alpha
        }
    }

    save_csv_table(
        item_statistics,
        paste0(
            "statistik_item_kuesioner_",
            respondent_type,
            ".csv"
        )
    )

    save_csv_table(
        respondent_statistics,
        paste0(
            "statistik_responden_kuesioner_",
            respondent_type,
            ".csv"
        )
    )

    save_csv_table(
        overall_statistics,
        paste0(
            "ringkasan_kuesioner_",
            respondent_type,
            ".csv"
        )
    )

    save_csv_table(
        reliability_result,
        paste0(
            "reliabilitas_kuesioner_",
            respondent_type,
            ".csv"
        )
    )

    item_plot <- ggplot(
        item_statistics,
        aes(
            x = reorder(
                item,
                mean_score
            ),
            y = mean_score
        )
    ) +
        geom_col() +
        coord_flip() +
        geom_hline(
            yintercept = 3,
            linetype = "dashed"
        ) +
        scale_y_continuous(
            limits = c(0, 5),
            breaks = 0:5
        ) +
        labs(
            title = paste(
                "Rata-Rata Item Kuesioner",
                stringr::str_to_title(
                    respondent_type
                )
            ),
            x = "Item",
            y = "Rata-Rata Skor"
        )

    save_figure(
        item_plot,
        paste0(
            "rata_rata_item_kuesioner_",
            respondent_type,
            ".png"
        )
    )

    list(
        item_statistics = item_statistics,
        respondent_statistics =
            respondent_statistics,
        overall_statistics =
            overall_statistics,
        reliability_result =
            reliability_result
    )
}

student_questionnaire_result <- analyse_questionnaire(
    here(
        "analytics",
        "data",
        "processed",
        "kuesioner_siswa_clean.csv"
    ),
    "siswa"
)

teacher_questionnaire_result <- analyse_questionnaire(
    here(
        "analytics",
        "data",
        "processed",
        "kuesioner_guru_clean.csv"
    ),
    "guru"
)

# ------------------------------------------------------------
# Workbook deskriptif
# ------------------------------------------------------------

descriptive_workbook <- list(
    Ringkasan_Percobaan =
        attempt_summary,
    Ringkasan_Siswa =
        student_attempt_summary,
    Distribusi_Kesulitan =
        difficulty_distribution,
    Akurasi_Kesulitan =
        difficulty_accuracy,
    Distribusi_Bobot =
        weight_distribution,
    Akurasi_Bobot =
        weight_accuracy,
    Berdasarkan_Nomor =
        position_summary,
    Transisi_Level =
        level_transitions
)

writexl::write_xlsx(
    descriptive_workbook,
    here(
        "analytics",
        "output",
        "tables",
        "hasil_statistik_deskriptif.xlsx"
    )
)

message("================================================")
message("Analisis deskriptif selesai.")
message("================================================")
