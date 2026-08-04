# ============================================================
# 04b_question_classification.R
# Analisis kesesuaian klasifikasi tingkat kesulitan soal
# ============================================================

SETUP_FILE <- if (
    file.exists(
        "analytics/script/00_setup.R"
    )
) {
    "analytics/script/00_setup.R"
} else if (
    file.exists("00_setup.R")
) {
    "00_setup.R"
} else {
    stop(
        "File 00_setup.R tidak ditemukan."
    )
}

source(SETUP_FILE)

if (
    !requireNamespace(
        "jsonlite",
        quietly = TRUE
    )
) {
    install.packages("jsonlite")
}

# ============================================================
# KONFIGURASI FILE
# ============================================================

CLASSIFICATION_FILE <- here(
    "analytics",
    "data",
    "raw",
    "question-classification-results.json"
)

OUTPUT_WORKBOOK <- here(
    "analytics",
    "output",
    "tables",
    "hasil_analisis_klasifikasi_soal.xlsx"
)

SUMMARY_TEXT_FILE <- here(
    "analytics",
    "output",
    "ringkasan_klasifikasi_soal.txt"
)

if (!file.exists(CLASSIFICATION_FILE)) {
    stop(
        paste(
            "File hasil klasifikasi tidak ditemukan:",
            CLASSIFICATION_FILE,
            "\nJalankan script TypeScript",
            "export-question-classification-result.ts terlebih dahulu."
        )
    )
}

# ============================================================
# MEMBACA JSON HASIL CLASSIFIER
# ============================================================

raw_json <- jsonlite::fromJSON(
    CLASSIFICATION_FILE,
    flatten = TRUE,
    simplifyDataFrame = TRUE
)

if (
    is.null(raw_json$questions) ||
        nrow(raw_json$questions) == 0
) {
    stop(
        "JSON tidak memiliki data questions."
    )
}

classification_data <- raw_json$questions |>
    tibble::as_tibble() |>
    janitor::clean_names()

required_columns <- c(
    "question_number",
    "topic",
    "question_text",
    "reference_difficulty",
    "system_difficulty",
    "difficulty_score",
    "detected_indicator_text",
    "weight_priority",
    "weight"
)

missing_columns <- setdiff(
    required_columns,
    names(classification_data)
)

if (length(missing_columns) > 0) {
    stop(
        "Kolom wajib tidak ditemukan:\n",
        paste(
            missing_columns,
            collapse = ", "
        )
    )
}

difficulty_levels <- c(
    "LOW",
    "MEDIUM",
    "HIGH"
)

classification_data <- classification_data |>
    dplyr::transmute(
        question_number =
            as.integer(
                question_number
            ),

        topic =
            as.character(
                topic
            ),

        question_text =
            as.character(
                question_text
            ),

        option_a =
            as.character(
                option_a
            ),

        option_b =
            as.character(
                option_b
            ),

        option_c =
            as.character(
                option_c
            ),

        option_d =
            as.character(
                option_d
            ),

        correct_answer =
            as.character(
                correct_answer
            ),

        reference_difficulty =
            stringr::str_to_upper(
                as.character(
                    reference_difficulty
                )
            ),

        system_difficulty =
            stringr::str_to_upper(
                as.character(
                    system_difficulty
                )
            ),

        difficulty_score =
            as.numeric(
                difficulty_score
            ),

        detected_indicators =
            as.character(
                detected_indicator_text
            ),

        weight_priority =
            as.character(
                weight_priority
            ),

        weight =
            as.numeric(
                weight
            ),

        is_match =
            reference_difficulty ==
                system_difficulty
    ) |>
    dplyr::filter(
        !is.na(question_number),
        reference_difficulty %in%
            difficulty_levels,
        system_difficulty %in%
            difficulty_levels
    ) |>
    dplyr::arrange(
        question_number
    )

if (nrow(classification_data) == 0) {
    stop(
        "Tidak ada baris klasifikasi valid."
    )
}

save_processed_csv(
    classification_data,
    "klasifikasi_soal_clean.csv"
)

save_csv_table(
    classification_data,
    "detail_klasifikasi_soal.csv"
)

# ============================================================
# CONFUSION MATRIX
# Baris = label acuan
# Kolom = hasil sistem
# ============================================================

confusion_matrix <- classification_data |>
    dplyr::count(
        reference_difficulty,
        system_difficulty,
        name = "question_count"
    ) |>
    tidyr::complete(
        reference_difficulty =
            difficulty_levels,
        system_difficulty =
            difficulty_levels,
        fill = list(
            question_count = 0L
        )
    ) |>
    dplyr::mutate(
        reference_difficulty =
            factor(
                reference_difficulty,
                levels =
                    difficulty_levels
            ),

        system_difficulty =
            factor(
                system_difficulty,
                levels =
                    difficulty_levels
            )
    ) |>
    dplyr::arrange(
        reference_difficulty,
        system_difficulty
    )

save_csv_table(
    confusion_matrix,
    "confusion_matrix_klasifikasi_soal.csv"
)

# ============================================================
# KAPPA COHEN
# ============================================================

total_questions <- nrow(
    classification_data
)

matched_questions <- sum(
    classification_data$is_match,
    na.rm = TRUE
)

unmatched_questions <-
    total_questions -
    matched_questions

observed_agreement <-
    matched_questions /
    total_questions

reference_distribution <-
    classification_data |>
    dplyr::count(
        reference_difficulty,
        name = "reference_count"
    ) |>
    tidyr::complete(
        reference_difficulty =
            difficulty_levels,
        fill = list(
            reference_count = 0L
        )
    )

system_distribution <-
    classification_data |>
    dplyr::count(
        system_difficulty,
        name = "system_count"
    ) |>
    tidyr::complete(
        system_difficulty =
            difficulty_levels,
        fill = list(
            system_count = 0L
        )
    )

expected_agreement <- sum(
    (
        reference_distribution$
            reference_count /
            total_questions
    ) *
        (
            system_distribution$
                system_count /
                total_questions
        )
)

cohen_kappa <- if (
    expected_agreement < 1
) {
    (
        observed_agreement -
            expected_agreement
    ) /
        (
            1 -
                expected_agreement
        )
} else {
    NA_real_
}

interpret_kappa <- function(value) {
    dplyr::case_when(
        is.na(value) ~
            NA_character_,
        value < 0 ~
            "Lebih buruk dari kebetulan",
        value < 0.20 ~
            "Sangat rendah",
        value < 0.40 ~
            "Rendah",
        value < 0.60 ~
            "Sedang",
        value < 0.80 ~
            "Kuat",
        TRUE ~
            "Sangat kuat"
    )
}

overall_summary <- tibble::tibble(
    total_questions =
        total_questions,

    matched_questions =
        matched_questions,

    unmatched_questions =
        unmatched_questions,

    accuracy_percent =
        observed_agreement *
            100,

    expected_agreement_percent =
        expected_agreement *
            100,

    cohen_kappa =
        cohen_kappa,

    kappa_interpretation =
        interpret_kappa(
            cohen_kappa
        )
)

save_csv_table(
    overall_summary,
    "ringkasan_klasifikasi_soal.csv"
)

# ============================================================
# METRIK PER KATEGORI
# ============================================================

calculate_class_metrics <- function(
  target_level
) {
    reference_positive <-
        classification_data$
            reference_difficulty ==
        target_level

    predicted_positive <-
        classification_data$
            system_difficulty ==
        target_level

    true_positive <- sum(
        reference_positive &
            predicted_positive
    )

    false_negative <- sum(
        reference_positive &
            !predicted_positive
    )

    false_positive <- sum(
        !reference_positive &
            predicted_positive
    )

    true_negative <- sum(
        !reference_positive &
            !predicted_positive
    )

    safe_divide <- function(
      numerator,
      denominator
    ) {
        if (denominator == 0) {
            return(NA_real_)
        }

        numerator /
            denominator
    }

    precision <- safe_divide(
        true_positive,
        true_positive +
            false_positive
    )

    recall <- safe_divide(
        true_positive,
        true_positive +
            false_negative
    )

    specificity <- safe_divide(
        true_negative,
        true_negative +
            false_positive
    )

    f1_score <- if (
        is.na(precision) ||
            is.na(recall) ||
            precision +
                recall ==
                0
    ) {
        NA_real_
    } else {
        2 *
            precision *
            recall /
            (
                precision +
                    recall
            )
    }

    tibble::tibble(
        difficulty =
            target_level,

        reference_count =
            sum(
                reference_positive
            ),

        predicted_count =
            sum(
                predicted_positive
            ),

        true_positive =
            true_positive,

        false_negative =
            false_negative,

        false_positive =
            false_positive,

        true_negative =
            true_negative,

        precision_percent =
            precision *
                100,

        recall_percent =
            recall *
                100,

        specificity_percent =
            specificity *
                100,

        f1_score =
            f1_score
    )
}

class_metrics <- purrr::map_dfr(
    difficulty_levels,
    calculate_class_metrics
)

save_csv_table(
    class_metrics,
    "metrik_per_kategori_klasifikasi.csv"
)

# ============================================================
# DISTRIBUSI LABEL
# ============================================================

label_distribution <- dplyr::bind_rows(
    classification_data |>
        dplyr::count(
            difficulty =
                reference_difficulty,
            name =
                "question_count"
        ) |>
        dplyr::mutate(
            label_source =
                "Label acuan"
        ),

    classification_data |>
        dplyr::count(
            difficulty =
                system_difficulty,
            name =
                "question_count"
        ) |>
        dplyr::mutate(
            label_source =
                "Hasil sistem"
        )
) |>
    dplyr::group_by(
        label_source
    ) |>
    dplyr::mutate(
        percentage =
            question_count /
                sum(
                    question_count
                ) *
                100
    ) |>
    dplyr::ungroup() |>
    dplyr::mutate(
        difficulty =
            factor(
                difficulty,
                levels =
                    difficulty_levels
            )
    )

save_csv_table(
    label_distribution,
    "distribusi_label_klasifikasi.csv"
)

# ============================================================
# HASIL PER TOPIK
# ============================================================

topic_summary <- classification_data |>
    dplyr::group_by(
        topic
    ) |>
    dplyr::summarise(
        total_questions =
            dplyr::n(),

        matched_questions =
            sum(
                is_match,
                na.rm = TRUE
            ),

        unmatched_questions =
            sum(
                !is_match,
                na.rm = TRUE
            ),

        accuracy_percent =
            mean(
                is_match,
                na.rm = TRUE
            ) *
                100,

        mean_difficulty_score =
            mean(
                difficulty_score,
                na.rm = TRUE
            ),

        .groups = "drop"
    )

save_csv_table(
    topic_summary,
    "ringkasan_klasifikasi_per_topik.csv"
)

# ============================================================
# SOAL YANG TIDAK SESUAI
# ============================================================

mismatch_questions <- classification_data |>
    dplyr::filter(
        !is_match
    ) |>
    dplyr::select(
        question_number,
        topic,
        question_text,
        reference_difficulty,
        system_difficulty,
        difficulty_score,
        detected_indicators,
        weight_priority,
        weight
    )

save_csv_table(
    mismatch_questions,
    "soal_tidak_sesuai_klasifikasi.csv"
)

# ============================================================
# RINGKASAN SKOR CLASSIFIER
# ============================================================

score_summary <- classification_data |>
    dplyr::group_by(
        reference_difficulty,
        system_difficulty
    ) |>
    dplyr::summarise(
        total_questions =
            dplyr::n(),

        mean_score =
            mean(
                difficulty_score,
                na.rm = TRUE
            ),

        sd_score =
            stats::sd(
                difficulty_score,
                na.rm = TRUE
            ),

        minimum_score =
            min(
                difficulty_score,
                na.rm = TRUE
            ),

        maximum_score =
            max(
                difficulty_score,
                na.rm = TRUE
            ),

        .groups = "drop"
    )

save_csv_table(
    score_summary,
    "ringkasan_skor_klasifikasi.csv"
)

# ============================================================
# GRAFIK CONFUSION MATRIX
# ============================================================

confusion_plot <- ggplot2::ggplot(
    confusion_matrix,
    ggplot2::aes(
        x = system_difficulty,
        y = reference_difficulty,
        fill = question_count
    )
) +
    ggplot2::geom_tile() +
    ggplot2::geom_text(
        ggplot2::aes(
            label =
                question_count
        ),
        size = 5
    ) +
    ggplot2::labs(
        title =
            "Confusion Matrix Klasifikasi Tingkat Kesulitan",

        subtitle =
            "Baris menunjukkan label acuan dan kolom menunjukkan hasil sistem",

        x =
            "Hasil Klasifikasi Sistem",

        y =
            "Label Acuan",

        fill =
            "Jumlah Soal"
    )

save_figure(
    confusion_plot,
    "confusion_matrix_klasifikasi_soal.png",
    width = 8,
    height = 6
)

# ============================================================
# GRAFIK DISTRIBUSI LABEL
# ============================================================

distribution_plot <- ggplot2::ggplot(
    label_distribution,
    ggplot2::aes(
        x = difficulty,
        y = question_count,
        fill = label_source
    )
) +
    ggplot2::geom_col(
        position =
            "dodge"
    ) +
    ggplot2::labs(
        title =
            "Perbandingan Distribusi Label Tingkat Kesulitan",

        x =
            "Tingkat Kesulitan",

        y =
            "Jumlah Soal",

        fill =
            "Sumber Label"
    )

save_figure(
    distribution_plot,
    "distribusi_label_klasifikasi_soal.png",
    width = 9,
    height = 6
)

# ============================================================
# GRAFIK RECALL PER KATEGORI
# ============================================================

recall_plot <- ggplot2::ggplot(
    class_metrics,
    ggplot2::aes(
        x = factor(
            difficulty,
            levels =
                difficulty_levels
        ),
        y = recall_percent
    )
) +
    ggplot2::geom_col() +
    ggplot2::geom_text(
        ggplot2::aes(
            label =
                paste0(
                    round(
                        recall_percent,
                        1
                    ),
                    "%"
                )
        ),
        vjust = -0.4
    ) +
    ggplot2::scale_y_continuous(
        limits = c(
            0,
            105
        )
    ) +
    ggplot2::labs(
        title =
            "Kesesuaian Klasifikasi per Kategori",

        x =
            "Tingkat Kesulitan",

        y =
            "Recall/Kesesuaian (%)"
    )

save_figure(
    recall_plot,
    "kesesuaian_klasifikasi_per_kategori.png",
    width = 8,
    height = 6
)

# ============================================================
# WORKBOOK HASIL
# ============================================================

classification_workbook <- list(
    Ringkasan =
        overall_summary,

    Confusion_Matrix =
        confusion_matrix,

    Metrik_Kategori =
        class_metrics,

    Distribusi_Label =
        label_distribution,

    Ringkasan_Topik =
        topic_summary,

    Soal_Tidak_Sesuai =
        mismatch_questions,

    Ringkasan_Skor =
        score_summary,

    Detail_Soal =
        classification_data
)

writexl::write_xlsx(
    classification_workbook,
    OUTPUT_WORKBOOK
)

# ============================================================
# RINGKASAN TEKS
# ============================================================

summary_lines <- c(
    "RINGKASAN ANALISIS KLASIFIKASI SOAL",
    "====================================",
    "",
    paste(
        "Jumlah soal:",
        total_questions
    ),
    paste(
        "Klasifikasi sesuai:",
        matched_questions
    ),
    paste(
        "Klasifikasi tidak sesuai:",
        unmatched_questions
    ),
    paste0(
        "Persentase kesesuaian: ",
        round(
            observed_agreement *
                100,
            2
        ),
        "%"
    ),
    paste(
        "Cohen's Kappa:",
        round(
            cohen_kappa,
            4
        )
    ),
    paste(
        "Interpretasi Kappa:",
        interpret_kappa(
            cohen_kappa
        )
    ),
    "",
    "Kesesuaian per kategori:"
)

for (
    row_number in
    seq_len(
        nrow(
            class_metrics
        )
    )
) {
    current_row <-
        class_metrics[
            row_number,
        ]

    summary_lines <- c(
        summary_lines,
        paste0(
            "- ",
            current_row$difficulty,
            ": ",
            round(
                current_row$recall_percent,
                2
            ),
            "%"
        )
    )
}

summary_lines <- c(
    summary_lines,
    "",
    paste(
        "Workbook:",
        OUTPUT_WORKBOOK
    )
)

writeLines(
    summary_lines,
    SUMMARY_TEXT_FILE
)

message("")
message("================================================")
message("ANALISIS KLASIFIKASI SOAL SELESAI")
message("================================================")
message(
    "Jumlah soal: ",
    total_questions
)
message(
    "Sesuai: ",
    matched_questions
)
message(
    "Tidak sesuai: ",
    unmatched_questions
)
message(
    "Persentase kesesuaian: ",
    round(
        observed_agreement *
            100,
        2
    ),
    "%"
)
message(
    "Cohen's Kappa: ",
    round(
        cohen_kappa,
        4
    ),
    " (",
    interpret_kappa(
        cohen_kappa
    ),
    ")"
)
message(
    "Workbook: ",
    OUTPUT_WORKBOOK
)
message("================================================")
