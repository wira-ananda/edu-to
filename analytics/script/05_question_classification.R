# ============================================================
# 05_question_classification.R
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
    stop(
        paste(
            "Package jsonlite belum tersedia.",
            "Instal menggunakan install.packages('jsonlite')."
        )
    )
}

# ============================================================
# KONFIGURASI FILE
# ============================================================

CLASSIFICATION_FILE <- here::here(
    "analytics",
    "data",
    "raw",
    "question-classification-results.json"
)

TABLE_DIRECTORY <- here::here(
    "analytics",
    "output",
    "tables"
)

FIGURE_DIRECTORY <- here::here(
    "analytics",
    "output",
    "figures"
)

OUTPUT_WORKBOOK <- file.path(
    TABLE_DIRECTORY,
    "hasil_analisis_klasifikasi_soal.xlsx"
)

SUMMARY_TEXT_FILE <- here::here(
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

# Menghapus output lama yang sudah tidak digunakan.
obsolete_table_files <- c(
    "metrik_per_kategori_klasifikasi.csv",
    "ringkasan_skor_klasifikasi.csv"
)

obsolete_figure_files <- c(
    "kesesuaian_klasifikasi_per_kategori.png"
)

unlink(
    file.path(
        TABLE_DIRECTORY,
        obsolete_table_files
    ),
    force = TRUE
)

unlink(
    file.path(
        FIGURE_DIRECTORY,
        obsolete_figure_files
    ),
    force = TRUE
)

# ============================================================
# MEMBACA JSON HASIL CLASSIFIER
# ============================================================

raw_json <- jsonlite::fromJSON(
    CLASSIFICATION_FILE,
    flatten = TRUE,
    simplifyDataFrame = TRUE
)

if (
    is.null(
        raw_json$
            questions
    ) ||
        nrow(
            raw_json$
                questions
        ) == 0
) {
    stop(
        "JSON tidak memiliki data questions."
    )
}

classification_data <- raw_json$
    questions |>
    tibble::as_tibble() |>
    janitor::clean_names()

required_columns <- c(
    "question_number",
    "topic",
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_answer",
    "reference_difficulty",
    "system_difficulty",
    "difficulty_score",
    "detected_indicator_text",
    "weight_priority",
    "weight"
)

missing_columns <- setdiff(
    required_columns,
    names(
        classification_data
    )
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
        !is.na(
            question_number
        ),
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
        "Tidak ada baris klasifikasi yang valid."
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
# RINGKASAN KESESUAIAN KESELURUHAN
# ============================================================

total_questions <- nrow(
    classification_data
)

matched_questions <- sum(
    classification_data$
        is_match,
    na.rm = TRUE
)

unmatched_questions <-
    total_questions -
    matched_questions

conformity_percentage <-
    matched_questions /
        total_questions *
        100

overall_summary <- tibble::tibble(
    total_questions =
        total_questions,
    matched_questions =
        matched_questions,
    unmatched_questions =
        unmatched_questions,
    conformity_percentage =
        conformity_percentage
)

save_csv_table(
    overall_summary,
    "ringkasan_klasifikasi_soal.csv"
)

# ============================================================
# CONFUSION MATRIX
# Baris = kategori acuan
# Kolom = hasil klasifikasi sistem
# ============================================================

confusion_matrix_long <- classification_data |>
    dplyr::count(
        reference_difficulty,
        system_difficulty,
        name =
            "question_count"
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

confusion_matrix <- confusion_matrix_long |>
    dplyr::mutate(
        reference_difficulty =
            as.character(
                reference_difficulty
            ),
        system_difficulty =
            as.character(
                system_difficulty
            )
    ) |>
    tidyr::pivot_wider(
        names_from =
            system_difficulty,
        values_from =
            question_count,
        values_fill =
            0
    ) |>
    dplyr::mutate(
        total =
            LOW +
                MEDIUM +
                HIGH
    ) |>
    dplyr::arrange(
        match(
            reference_difficulty,
            difficulty_levels
        )
    )

confusion_matrix_total <- tibble::tibble(
    reference_difficulty =
        "Jumlah",
    LOW =
        sum(
            confusion_matrix$
                LOW
        ),
    MEDIUM =
        sum(
            confusion_matrix$
                MEDIUM
        ),
    HIGH =
        sum(
            confusion_matrix$
                HIGH
        ),
    total =
        sum(
            confusion_matrix$
                total
        )
)

confusion_matrix <- dplyr::bind_rows(
    confusion_matrix,
    confusion_matrix_total
)

save_csv_table(
    confusion_matrix,
    "confusion_matrix_klasifikasi_soal.csv"
)

# ============================================================
# KESESUAIAN BERDASARKAN KATEGORI ACUAN
# ============================================================

category_conformity <- classification_data |>
    dplyr::group_by(
        reference_difficulty
    ) |>
    dplyr::summarise(
        reference_count =
            dplyr::n(),
        matched_count =
            sum(
                is_match,
                na.rm = TRUE
            ),
        unmatched_count =
            sum(
                !is_match,
                na.rm = TRUE
            ),
        conformity_percentage =
            matched_count /
                reference_count *
                100,
        .groups =
            "drop"
    ) |>
    dplyr::mutate(
        reference_difficulty =
            factor(
                reference_difficulty,
                levels =
                    difficulty_levels
            )
    ) |>
    dplyr::arrange(
        reference_difficulty
    ) |>
    dplyr::mutate(
        reference_difficulty =
            as.character(
                reference_difficulty
            )
    )

save_csv_table(
    category_conformity,
    "ringkasan_kesesuaian_per_kategori.csv"
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
# RINGKASAN HASIL PER TOPIK
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
        conformity_percentage =
            matched_questions /
                total_questions *
                100,
        .groups =
            "drop"
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
# GRAFIK CONFUSION MATRIX
# ============================================================

confusion_plot <- ggplot2::ggplot(
    confusion_matrix_long,
    ggplot2::aes(
        x =
            system_difficulty,
        y =
            reference_difficulty,
        fill =
            question_count
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
            paste(
                "Baris menunjukkan label acuan",
                "dan kolom menunjukkan hasil sistem"
            ),
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
        x =
            difficulty,
        y =
            question_count,
        fill =
            label_source
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
# WORKBOOK HASIL KLASIFIKASI
# ============================================================

classification_workbook <- list(
    Ringkasan =
        overall_summary,
    Confusion_Matrix =
        confusion_matrix,
    Kesesuaian_Kategori =
        category_conformity,
    Distribusi_Label =
        label_distribution,
    Ringkasan_Topik =
        topic_summary,
    Soal_Tidak_Sesuai =
        mismatch_questions,
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
            conformity_percentage,
            2
        ),
        "%"
    ),
    "",
    "Kesesuaian berdasarkan kategori:"
)

for (
    row_number in
    seq_len(
        nrow(
            category_conformity
        )
    )
) {
    current_row <-
        category_conformity[
            row_number,
        ]

    summary_lines <- c(
        summary_lines,
        paste0(
            "- ",
            current_row$
                reference_difficulty,
            ": ",
            current_row$
                matched_count,
            " dari ",
            current_row$
                reference_count,
            " soal sesuai (",
            round(
                current_row$
                    conformity_percentage,
                2
            ),
            "%)"
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
        conformity_percentage,
        2
    ),
    "%"
)
message(
    "Workbook: ",
    OUTPUT_WORKBOOK
)
message("================================================")
