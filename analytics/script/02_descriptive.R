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

VALIDITY_ALPHA <- 0.05
RELIABILITY_THRESHOLD <- 0.70

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

interpret_reliability <- function(value) {
    dplyr::case_when(
        is.na(value) ~ "Tidak dapat dihitung",
        value < 0.60 ~ "Rendah",
        value < 0.70 ~ "Cukup",
        value < 0.80 ~ "Baik",
        value < 0.90 ~ "Sangat baik",
        TRUE ~ "Sangat tinggi"
    )
}

calculate_r_critical <- function(
  sample_size,
  alpha = VALIDITY_ALPHA
) {
    if (
        is.na(sample_size) ||
            sample_size <= 2
    ) {
        return(NA_real_)
    }

    degrees_of_freedom <-
        sample_size - 2

    t_critical <- stats::qt(
        1 - alpha / 2,
        df = degrees_of_freedom
    )

    sqrt(
        t_critical^2 /
            (
                t_critical^2 +
                    degrees_of_freedom
            )
    )
}

calculate_item_validity <- function(
  data,
  item_columns,
  alpha = VALIDITY_ALPHA
) {
    item_data <- data |>
        dplyr::select(
            dplyr::all_of(
                item_columns
            )
        ) |>
        dplyr::mutate(
            dplyr::across(
                dplyr::everything(),
                ~ suppressWarnings(
                    as.numeric(.x)
                )
            )
        )

    purrr::map_dfr(
        item_columns,
        function(item_name) {
            other_items <- setdiff(
                item_columns,
                item_name
            )

            if (length(other_items) == 0) {
                return(
                    tibble::tibble(
                        item = item_name,
                        sample_size = 0L,
                        r_count = NA_real_,
                        r_table = NA_real_,
                        p_value = NA_real_,
                        correlation_direction =
                            NA_character_,
                        validity_status =
                            "Tidak dapat diuji",
                        information =
                            "Minimal diperlukan dua item."
                    )
                )
            }

            other_item_data <-
                item_data[
                    other_items
                ]

            complete_other_items <-
                stats::complete.cases(
                    other_item_data
                )

            corrected_total_score <- rep(
                NA_real_,
                nrow(item_data)
            )

            corrected_total_score[
                complete_other_items
            ] <- rowSums(
                other_item_data[
                    complete_other_items,
                    ,
                    drop = FALSE
                ],
                na.rm = FALSE
            )

            item_score <-
                item_data[[item_name]]

            valid_rows <- stats::complete.cases(
                item_score,
                corrected_total_score
            )

            sample_size <- sum(valid_rows)

            item_values <-
                item_score[valid_rows]

            total_values <-
                corrected_total_score[
                    valid_rows
                ]

            enough_variation <-
                sample_size >= 3 &&
                dplyr::n_distinct(
                    item_values
                ) >= 2 &&
                dplyr::n_distinct(
                    total_values
                ) >= 2

            if (!enough_variation) {
                return(
                    tibble::tibble(
                        item = item_name,
                        sample_size =
                            as.integer(
                                sample_size
                            ),
                        r_count = NA_real_,
                        r_table =
                            calculate_r_critical(
                                sample_size,
                                alpha
                            ),
                        p_value = NA_real_,
                        correlation_direction =
                            NA_character_,
                        validity_status =
                            "Tidak dapat diuji",
                        information = paste(
                            "Data valid atau variasi skor",
                            "tidak mencukupi."
                        )
                    )
                )
            }

            correlation_test <- tryCatch(
                stats::cor.test(
                    item_values,
                    total_values,
                    method = "pearson",
                    alternative =
                        "two.sided"
                ),
                error = function(error) {
                    NULL
                }
            )

            if (is.null(correlation_test)) {
                return(
                    tibble::tibble(
                        item = item_name,
                        sample_size =
                            as.integer(
                                sample_size
                            ),
                        r_count = NA_real_,
                        r_table =
                            calculate_r_critical(
                                sample_size,
                                alpha
                            ),
                        p_value = NA_real_,
                        correlation_direction =
                            NA_character_,
                        validity_status =
                            "Tidak dapat diuji",
                        information =
                            "Uji korelasi gagal dijalankan."
                    )
                )
            }

            r_count <- unname(
                correlation_test$estimate
            )

            p_value <-
                correlation_test$p.value

            r_table <- calculate_r_critical(
                sample_size,
                alpha
            )

            is_valid <-
                !is.na(r_count) &&
                !is.na(r_table) &&
                r_count > 0 &&
                r_count > r_table &&
                p_value < alpha

            tibble::tibble(
                item = item_name,
                sample_size =
                    as.integer(
                        sample_size
                    ),
                r_count = r_count,
                r_table = r_table,
                p_value = p_value,
                correlation_direction =
                    dplyr::case_when(
                        r_count > 0 ~ "Positif",
                        r_count < 0 ~ "Negatif",
                        TRUE ~ "Nol"
                    ),
                validity_status =
                    dplyr::if_else(
                        is_valid,
                        "Valid",
                        "Tidak valid"
                    ),
                information = paste(
                    "Kriteria: r hitung > r tabel,",
                    "p-value <",
                    alpha,
                    "dan korelasi positif."
                )
            )
        }
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

    data <- data |>
        dplyr::mutate(
            dplyr::across(
                dplyr::all_of(
                    item_columns
                ),
                ~ suppressWarnings(
                    as.numeric(.x)
                )
            )
        )

    invalid_likert_values <- data |>
        dplyr::select(
            dplyr::all_of(
                item_columns
            )
        ) |>
        unlist(
            use.names = FALSE
        )

    invalid_likert_count <- sum(
        !is.na(invalid_likert_values) &
            !invalid_likert_values %in% 1:5
    )

    if (invalid_likert_count > 0) {
        warning(
            invalid_likert_count,
            " skor kuesioner berada di luar rentang 1-5."
        )

        data <- data |>
            dplyr::mutate(
                dplyr::across(
                    dplyr::all_of(
                        item_columns
                    ),
                    ~ dplyr::if_else(
                        .x %in% 1:5,
                        .x,
                        NA_real_
                    )
                )
            )
    }

    # --------------------------------------------------------
    # Uji validitas item
    # Corrected item-total correlation:
    # skor satu item dikorelasikan dengan total item lainnya.
    # --------------------------------------------------------

    item_validity <- calculate_item_validity(
        data,
        item_columns,
        alpha = VALIDITY_ALPHA
    )

    validity_summary <- tibble::tibble(
        respondent_type = respondent_type,
        total_respondents = nrow(data),
        total_items = length(
            item_columns
        ),
        tested_items = sum(
            item_validity$
                validity_status !=
                "Tidak dapat diuji"
        ),
        valid_items = sum(
            item_validity$
                validity_status ==
                "Valid"
        ),
        invalid_items = sum(
            item_validity$
                validity_status ==
                "Tidak valid"
        ),
        untestable_items = sum(
            item_validity$
                validity_status ==
                "Tidak dapat diuji"
        ),
        valid_percentage =
            dplyr::if_else(
                tested_items > 0,
                valid_items /
                    tested_items *
                    100,
                NA_real_
            ),
        alpha_significance =
            VALIDITY_ALPHA,
        validity_method = paste(
            "Pearson corrected item-total",
            "correlation"
        ),
        validity_criterion = paste(
            "r hitung > r tabel,",
            "p-value <",
            VALIDITY_ALPHA,
            "dan korelasi positif"
        )
    )

    # --------------------------------------------------------
    # Statistik deskriptif item
    # --------------------------------------------------------

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
            minimum_score = if (
                all(is.na(score))
            ) {
                NA_real_
            } else {
                min(
                    score,
                    na.rm = TRUE
                )
            },
            maximum_score = if (
                all(is.na(score))
            ) {
                NA_real_
            } else {
                max(
                    score,
                    na.rm = TRUE
                )
            },
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
        ) |>
        dplyr::left_join(
            item_validity |>
                dplyr::select(
                    item,
                    r_count,
                    r_table,
                    p_value,
                    validity_status
                ),
            by = "item"
        )

    # --------------------------------------------------------
    # Statistik deskriptif setiap responden
    # --------------------------------------------------------

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

    all_item_scores <- unlist(
        data[item_columns],
        use.names = FALSE
    )

    valid_all_item_scores <-
        all_item_scores[
            !is.na(
                all_item_scores
            )
        ]

    overall_statistics <- tibble::tibble(
        respondent_type = respondent_type,
        total_respondents = nrow(data),
        total_items = length(
            item_columns
        ),
        minimum_score =
            if (
                length(
                    valid_all_item_scores
                ) > 0
            ) {
                min(
                    valid_all_item_scores
                )
            } else {
                NA_real_
            },
        maximum_score =
            if (
                length(
                    valid_all_item_scores
                ) > 0
            ) {
                max(
                    valid_all_item_scores
                )
            } else {
                NA_real_
            },
        overall_mean = mean(
            valid_all_item_scores,
            na.rm = TRUE
        ),
        overall_sd = stats::sd(
            valid_all_item_scores,
            na.rm = TRUE
        )
    ) |>
        dplyr::mutate(
            interpretation =
                interpret_likert(
                    overall_mean
                )
        )

    # --------------------------------------------------------
    # Uji reliabilitas Cronbach's Alpha
    # --------------------------------------------------------

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
        total_items_available = length(
            item_columns
        ),
        total_items_used = length(
            non_constant_items
        ),
        cronbach_alpha = NA_real_,
        reliability_threshold =
            RELIABILITY_THRESHOLD,
        reliable = NA,
        interpretation =
            "Tidak dapat dihitung",
        information = paste(
            "Reliabilitas dihitung setelah",
            "reverse scoring pada tahap import."
        )
    )

    alpha_result <- NULL

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
                message(
                    "Cronbach's Alpha gagal dihitung: ",
                    conditionMessage(error)
                )

                NULL
            }
        )

        if (!is.null(alpha_result)) {
            alpha_value <-
                alpha_result$total$raw_alpha

            reliability_result$cronbach_alpha <-
                alpha_value

            reliability_result$reliable <-
                !is.na(alpha_value) &&
                    alpha_value >=
                        RELIABILITY_THRESHOLD

            reliability_result$interpretation <-
                interpret_reliability(
                    alpha_value
                )
        }
    }

    # Alpha jika item dihapus ditambahkan sebagai informasi
    # diagnostik. Kolom ini tidak menjadi kriteria validitas.
    if (
        !is.null(alpha_result) &&
            !is.null(
                alpha_result$alpha.drop
            )
    ) {
        alpha_if_deleted <-
            alpha_result$alpha.drop |>
            tibble::rownames_to_column(
                "item"
            ) |>
            dplyr::transmute(
                item,
                alpha_if_item_deleted =
                    raw_alpha
            )

        item_validity <- item_validity |>
            dplyr::left_join(
                alpha_if_deleted,
                by = "item"
            )
    } else {
        item_validity <-
            item_validity |>
            dplyr::mutate(
                alpha_if_item_deleted =
                    NA_real_
            )
    }

    # --------------------------------------------------------
    # Menyimpan tabel kuesioner
    # --------------------------------------------------------

    save_csv_table(
        item_validity,
        paste0(
            "validitas_item_kuesioner_",
            respondent_type,
            ".csv"
        )
    )

    save_csv_table(
        validity_summary,
        paste0(
            "ringkasan_validitas_kuesioner_",
            respondent_type,
            ".csv"
        )
    )

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

    # --------------------------------------------------------
    # Grafik kuesioner
    # --------------------------------------------------------

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

    validity_plot_data <- item_validity |>
        dplyr::filter(
            !is.na(r_count),
            !is.na(r_table)
        )

    if (nrow(validity_plot_data) > 0) {
        validity_plot <- ggplot2::ggplot(
            validity_plot_data,
            ggplot2::aes(
                x = stats::reorder(
                    item,
                    r_count
                ),
                y = r_count
            )
        ) +
            ggplot2::geom_col() +
            ggplot2::geom_point(
                ggplot2::aes(
                    y = r_table
                ),
                size = 2
            ) +
            ggplot2::coord_flip() +
            ggplot2::labs(
                title = paste(
                    "Uji Validitas Item Kuesioner",
                    stringr::str_to_title(
                        respondent_type
                    )
                ),
                subtitle = paste(
                    "Batang = r hitung,",
                    "titik = r tabel"
                ),
                x = "Item",
                y = "Koefisien Korelasi"
            )

        save_figure(
            validity_plot,
            paste0(
                "validitas_item_kuesioner_",
                respondent_type,
                ".png"
            )
        )
    }

    message("")
    message(
        "Ringkasan kuesioner ",
        respondent_type,
        ":"
    )
    message(
        "- Responden: ",
        nrow(data)
    )
    message(
        "- Item valid: ",
        validity_summary$valid_items[[1]],
        " dari ",
        validity_summary$tested_items[[1]],
        " item yang dapat diuji"
    )
    message(
        "- Cronbach's Alpha: ",
        round(
            reliability_result$
                cronbach_alpha[[1]],
            4
        )
    )
    message(
        "- Status reliabilitas: ",
        ifelse(
            isTRUE(
                reliability_result$
                    reliable[[1]]
            ),
            "Reliabel",
            "Belum memenuhi batas"
        )
    )

    list(
        item_validity = item_validity,
        validity_summary =
            validity_summary,
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
    descriptive_workbook$Kuesioner_Validitas_Item <-
        student_questionnaire_result$
            item_validity

    descriptive_workbook$Kuesioner_Validitas <-
        student_questionnaire_result$
            validity_summary

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
