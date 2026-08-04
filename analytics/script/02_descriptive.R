# ============================================================
# 02_descriptive.R
# Statistik deskriptif data tryout dan kuesioner siswa
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

TRYOUT_CLEAN_FILE <- here::here(
    "analytics",
    "data",
    "processed",
    "tryout_clean.csv"
)

TRYOUT_METADATA_FILE <- here::here(
    "analytics",
    "data",
    "processed",
    "metadata_tryout.csv"
)

STUDENT_QUESTIONNAIRE_FILE <- here::here(
    "analytics",
    "data",
    "processed",
    "kuesioner_siswa_clean.csv"
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

required_columns <- c(
    "student_key",
    "student_id",
    "student_name",
    "attempt_number",
    "question_number",
    "question_id",
    "difficulty",
    "weight",
    "is_correct",
    "initial_level",
    "final_level"
)

missing_columns <- setdiff(
    required_columns,
    names(tryout_data)
)

if (length(missing_columns) > 0) {
    stop(
        "Kolom wajib tidak ditemukan pada tryout_clean.csv:\n",
        paste(
            missing_columns,
            collapse = ", "
        )
    )
}

tryout_data <- tryout_data |>
    dplyr::mutate(
        is_correct = as.logical(is_correct),
        attempt_number = as.integer(
            attempt_number
        ),
        question_number = as.integer(
            question_number
        ),
        weight = as.numeric(weight)
    )

TOTAL_QUESTIONS <- if (
    file.exists(TRYOUT_METADATA_FILE)
) {
    metadata <- readr::read_csv(
        TRYOUT_METADATA_FILE,
        show_col_types = FALSE
    )

    as.integer(
        metadata$total_questions[[1]]
    )
} else {
    max(
        tryout_data$question_number,
        na.rm = TRUE
    )
}

# ============================================================
# RINGKASAN SETIAP SISWA DAN PERCOBAAN
# ============================================================

student_attempt_summary <- tryout_data |>
    dplyr::group_by(
        student_key,
        student_id,
        student_name,
        attempt_number
    ) |>
    dplyr::summarise(
        initial_level = first_non_missing(
            initial_level,
            NA_character_
        ),
        final_level = first_non_missing(
            final_level,
            NA_character_
        ),
        total_questions =
            dplyr::n_distinct(
                question_number
            ),
        correct_count = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        wrong_count = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
        ),
        unanswered_count = sum(
            is.na(is_correct)
        ),
        total_weight = sum(
            weight,
            na.rm = TRUE
        ),
        weighted_correct = sum(
            weight *
                as.integer(
                    is_correct %in% TRUE
                ),
            na.rm = TRUE
        ),
        .groups = "drop"
    ) |>
    dplyr::mutate(
        expected_questions =
            TOTAL_QUESTIONS,
        completed =
            total_questions ==
                expected_questions &
                unanswered_count == 0,
        accuracy_percent =
            dplyr::if_else(
                total_questions > 0,
                correct_count /
                    total_questions *
                    100,
                NA_real_
            ),
        score_100 = accuracy_percent,
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

# ============================================================
# RINGKASAN BERDASARKAN PERCOBAAN
# ============================================================

attempt_summary <- student_attempt_summary |>
    dplyr::group_by(
        attempt_number
    ) |>
    dplyr::summarise(
        total_students =
            dplyr::n_distinct(
                student_key
            ),
        completed_students = sum(
            completed,
            na.rm = TRUE
        ),
        mean_correct = mean(
            correct_count,
            na.rm = TRUE
        ),
        sd_correct = stats::sd(
            correct_count,
            na.rm = TRUE
        ),
        median_correct = stats::median(
            correct_count,
            na.rm = TRUE
        ),
        minimum_correct = min(
            correct_count,
            na.rm = TRUE
        ),
        maximum_correct = max(
            correct_count,
            na.rm = TRUE
        ),
        mean_score = mean(
            score_100,
            na.rm = TRUE
        ),
        sd_score = stats::sd(
            score_100,
            na.rm = TRUE
        ),
        median_score = stats::median(
            score_100,
            na.rm = TRUE
        ),
        minimum_score = min(
            score_100,
            na.rm = TRUE
        ),
        maximum_score = max(
            score_100,
            na.rm = TRUE
        ),
        mean_weighted_score = mean(
            weighted_score_100,
            na.rm = TRUE
        ),
        sd_weighted_score = stats::sd(
            weighted_score_100,
            na.rm = TRUE
        ),
        .groups = "drop"
    )

save_csv_table(
    attempt_summary,
    "statistik_deskriptif_percobaan.csv"
)

# ============================================================
# DISTRIBUSI DAN AKURASI TINGKAT KESULITAN
# ============================================================

difficulty_distribution <- tryout_data |>
    dplyr::count(
        attempt_number,
        difficulty,
        name = "question_count"
    ) |>
    dplyr::group_by(
        attempt_number
    ) |>
    dplyr::mutate(
        percentage =
            question_count /
                sum(question_count) *
                100
    ) |>
    dplyr::ungroup()

save_csv_table(
    difficulty_distribution,
    "distribusi_tingkat_kesulitan.csv"
)

difficulty_accuracy <- tryout_data |>
    dplyr::group_by(
        attempt_number,
        difficulty
    ) |>
    dplyr::summarise(
        total_answers = dplyr::n(),
        correct_answers = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        wrong_answers = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
        ),
        unanswered_answers = sum(
            is.na(is_correct)
        ),
        accuracy_percent =
            dplyr::if_else(
                correct_answers +
                    wrong_answers > 0,
                correct_answers /
                    (correct_answers +
                        wrong_answers) *
                    100,
                NA_real_
            ),
        .groups = "drop"
    )

save_csv_table(
    difficulty_accuracy,
    "akurasi_berdasarkan_kesulitan.csv"
)

# ============================================================
# DISTRIBUSI DAN AKURASI BOBOT
# ============================================================

weight_distribution <- tryout_data |>
    dplyr::count(
        attempt_number,
        weight,
        name = "selection_count"
    ) |>
    dplyr::group_by(
        attempt_number
    ) |>
    dplyr::mutate(
        percentage =
            selection_count /
                sum(selection_count) *
                100
    ) |>
    dplyr::ungroup()

save_csv_table(
    weight_distribution,
    "distribusi_bobot_soal.csv"
)

weight_accuracy <- tryout_data |>
    dplyr::group_by(
        attempt_number,
        weight
    ) |>
    dplyr::summarise(
        total_answers = dplyr::n(),
        correct_answers = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        wrong_answers = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
        ),
        accuracy_percent =
            dplyr::if_else(
                correct_answers +
                    wrong_answers > 0,
                correct_answers /
                    (correct_answers +
                        wrong_answers) *
                    100,
                NA_real_
            ),
        .groups = "drop"
    )

save_csv_table(
    weight_accuracy,
    "akurasi_berdasarkan_bobot.csv"
)

# ============================================================
# STATISTIK BERDASARKAN NOMOR SOAL
# ============================================================

position_summary <- tryout_data |>
    dplyr::group_by(
        attempt_number,
        question_number
    ) |>
    dplyr::summarise(
        total_students =
            dplyr::n_distinct(
                student_key
            ),
        unique_questions =
            dplyr::n_distinct(
                question_id
            ),
        correct_count = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        wrong_count = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
        ),
        unanswered_count = sum(
            is.na(is_correct)
        ),
        accuracy_percent =
            dplyr::if_else(
                correct_count +
                    wrong_count > 0,
                correct_count /
                    (correct_count +
                        wrong_count) *
                    100,
                NA_real_
            ),
        mean_weight = mean(
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
    dplyr::count(
        attempt_number,
        question_number,
        difficulty,
        name = "question_count"
    ) |>
    dplyr::group_by(
        attempt_number,
        question_number
    ) |>
    dplyr::mutate(
        percentage =
            question_count /
                sum(question_count) *
                100
    ) |>
    dplyr::ungroup()

save_csv_table(
    position_difficulty,
    "kesulitan_berdasarkan_nomor_soal.csv"
)

# ============================================================
# PERUBAHAN LEVEL AWAL DAN AKHIR
# ============================================================

level_transitions <- student_attempt_summary |>
    dplyr::count(
        attempt_number,
        initial_level,
        final_level,
        name = "student_count"
    ) |>
    dplyr::group_by(
        attempt_number
    ) |>
    dplyr::mutate(
        percentage =
            student_count /
                sum(student_count) *
                100
    ) |>
    dplyr::ungroup()

save_csv_table(
    level_transitions,
    "perubahan_level_awal_akhir.csv"
)

# ============================================================
# GRAFIK TRYOUT
# ============================================================

score_boxplot <- ggplot2::ggplot(
    student_attempt_summary,
    ggplot2::aes(
        x = factor(attempt_number),
        y = score_100
    )
) +
    ggplot2::geom_boxplot() +
    ggplot2::geom_jitter(
        width = 0.12,
        alpha = 0.60
    ) +
    ggplot2::labs(
        title = "Distribusi Nilai Berdasarkan Percobaan",
        x = "Percobaan",
        y = "Nilai"
    )

save_figure(
    score_boxplot,
    "distribusi_nilai_percobaan.png"
)

difficulty_plot <- ggplot2::ggplot(
    difficulty_distribution,
    ggplot2::aes(
        x = factor(attempt_number),
        y = percentage,
        fill = difficulty
    )
) +
    ggplot2::geom_col(
        position = "dodge"
    ) +
    ggplot2::labs(
        title = "Distribusi Tingkat Kesulitan Soal",
        x = "Percobaan",
        y = "Persentase",
        fill = "Kesulitan"
    ) +
    ggplot2::scale_y_continuous(
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

position_accuracy_plot <- ggplot2::ggplot(
    position_summary,
    ggplot2::aes(
        x = question_number,
        y = accuracy_percent,
        group = factor(
            attempt_number
        ),
        linetype = factor(
            attempt_number
        )
    )
) +
    ggplot2::geom_line(
        linewidth = 1
    ) +
    ggplot2::geom_point(
        size = 2
    ) +
    ggplot2::scale_x_continuous(
        breaks = seq_len(
            TOTAL_QUESTIONS
        )
    ) +
    ggplot2::labs(
        title = "Akurasi Jawaban Berdasarkan Nomor Soal",
        x = "Nomor Soal",
        y = "Akurasi (%)",
        linetype = "Percobaan"
    )

save_figure(
    position_accuracy_plot,
    "akurasi_berdasarkan_nomor_soal.png"
)

# ============================================================
# ANALISIS KUESIONER SISWA
# ============================================================

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
        dplyr::select(
            dplyr::all_of(
                item_columns
            )
        ) |>
        tidyr::pivot_longer(
            cols = dplyr::everything(),
            names_to = "item",
            values_to = "score"
        ) |>
        dplyr::group_by(
            item
        ) |>
        dplyr::summarise(
            total_responses = sum(
                !is.na(score)
            ),
            mean_score = mean(
                score,
                na.rm = TRUE
            ),
            sd_score = stats::sd(
                score,
                na.rm = TRUE
            ),
            median_score = stats::median(
                score,
                na.rm = TRUE
            ),
            negative_percent = mean(
                score <= 2,
                na.rm = TRUE
            ) * 100,
            neutral_percent = mean(
                score == 3,
                na.rm = TRUE
            ) * 100,
            positive_percent = mean(
                score >= 4,
                na.rm = TRUE
            ) * 100,
            .groups = "drop"
        ) |>
        dplyr::mutate(
            interpretation =
                interpret_likert(
                    mean_score
                )
        )

    respondent_statistics <- data |>
        dplyr::rowwise() |>
        dplyr::mutate(
            mean_score = mean(
                dplyr::c_across(
                    dplyr::all_of(
                        item_columns
                    )
                ),
                na.rm = TRUE
            ),
            total_score = sum(
                dplyr::c_across(
                    dplyr::all_of(
                        item_columns
                    )
                ),
                na.rm = TRUE
            )
        ) |>
        dplyr::ungroup() |>
        dplyr::mutate(
            interpretation =
                interpret_likert(
                    mean_score
                )
        )

    overall_statistics <- tibble::tibble(
        respondent_type = respondent_type,
        total_respondents = nrow(data),
        total_items = length(
            item_columns
        ),
        overall_mean = mean(
            as.matrix(
                data[item_columns]
            ),
            na.rm = TRUE
        ),
        overall_sd = stats::sd(
            unlist(
                data[item_columns]
            ),
            na.rm = TRUE
        )
    ) |>
        dplyr::mutate(
            interpretation =
                interpret_likert(
                    overall_mean
                )
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
        total_items_used = length(
            non_constant_items
        ),
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

    item_plot <- ggplot2::ggplot(
        item_statistics,
        ggplot2::aes(
            x = stats::reorder(
                item,
                mean_score
            ),
            y = mean_score
        )
    ) +
        ggplot2::geom_col() +
        ggplot2::coord_flip() +
        ggplot2::geom_hline(
            yintercept = 3,
            linetype = "dashed"
        ) +
        ggplot2::scale_y_continuous(
            limits = c(0, 5),
            breaks = 0:5
        ) +
        ggplot2::labs(
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

student_questionnaire_result <-
    analyse_questionnaire(
        STUDENT_QUESTIONNAIRE_FILE,
        "siswa"
    )

# ============================================================
# WORKBOOK DESKRIPTIF
# ============================================================

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

if (!is.null(student_questionnaire_result)) {
    descriptive_workbook$Kuesioner_Item <-
        student_questionnaire_result$
            item_statistics

    descriptive_workbook$Kuesioner_Ringkasan <-
        student_questionnaire_result$
            overall_statistics

    descriptive_workbook$Kuesioner_Reliabilitas <-
        student_questionnaire_result$
            reliability_result
}

writexl::write_xlsx(
    descriptive_workbook,
    here::here(
        "analytics",
        "output",
        "tables",
        "hasil_statistik_deskriptif.xlsx"
    )
)

message("================================================")
message("Analisis deskriptif selesai.")
message("================================================")
