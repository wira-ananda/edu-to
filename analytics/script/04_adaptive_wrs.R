# ============================================================
# 04_adaptive_wrs.R
# Analisis tryout adaptif, variasi soal, bobot, dan WRS
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

TRYOUT_FILE <- here::here(
    "analytics",
    "data",
    "processed",
    "tryout_clean.csv"
)

METADATA_FILE <- here::here(
    "analytics",
    "data",
    "processed",
    "metadata_tryout.csv"
)

if (!file.exists(TRYOUT_FILE)) {
    stop(
        "Data tryout bersih tidak ditemukan. ",
        "Jalankan 01_import_clean.R terlebih dahulu."
    )
}

parse_logical_value <- function(x) {
    if (is.logical(x)) {
        return(x)
    }

    value <- x |>
        as.character() |>
        stringr::str_to_lower() |>
        stringr::str_squish()

    dplyr::case_when(
        value %in% c(
            "true",
            "1",
            "benar",
            "yes",
            "ya"
        ) ~ TRUE,
        value %in% c(
            "false",
            "0",
            "salah",
            "no",
            "tidak"
        ) ~ FALSE,
        TRUE ~ NA
    )
}

tryout_data <- readr::read_csv(
    TRYOUT_FILE,
    show_col_types = FALSE
)

required_columns <- c(
    "student_key",
    "student_name",
    "attempt_number",
    "question_number",
    "question_id",
    "question_text",
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

optional_wrs_columns <- c(
    "selection_level",
    "candidate_count",
    "wrs_total_weight",
    "random_value"
)

missing_wrs_columns <- setdiff(
    optional_wrs_columns,
    names(tryout_data)
)

if (length(missing_wrs_columns) > 0) {
    for (column_name in missing_wrs_columns) {
        tryout_data[[column_name]] <- NA
    }

    message(
        "Kolom log WRS tidak ditemukan: ",
        paste(
            missing_wrs_columns,
            collapse = ", "
        )
    )
}

tryout_data <- tryout_data |>
    dplyr::mutate(
        student_key = as.character(
            student_key
        ),
        student_name = as.character(
            student_name
        ),
        attempt_number = as.integer(
            attempt_number
        ),
        question_number = as.integer(
            question_number
        ),
        question_id = as.character(
            question_id
        ),
        question_text = as.character(
            question_text
        ),
        difficulty = stringr::str_to_upper(
            as.character(difficulty)
        ),
        weight = as.numeric(weight),
        is_correct = parse_logical_value(
            is_correct
        ),
        initial_level = dplyr::na_if(
            stringr::str_to_upper(
                as.character(initial_level)
            ),
            "NA"
        ),
        final_level = dplyr::na_if(
            stringr::str_to_upper(
                as.character(final_level)
            ),
            "NA"
        ),
        selection_level = dplyr::na_if(
            stringr::str_to_upper(
                as.character(selection_level)
            ),
            "NA"
        ),
        candidate_count = as.integer(
            candidate_count
        ),
        wrs_total_weight = as.numeric(
            wrs_total_weight
        ),
        random_value = as.numeric(
            random_value
        )
    ) |>
    dplyr::filter(
        !is.na(attempt_number),
        attempt_number > 0,
        !is.na(question_number),
        question_number > 0,
        !is.na(student_key),
        student_key != "",
        !is.na(question_id),
        question_id != "",
        !is.na(difficulty),
        !is.na(weight)
    )

TOTAL_QUESTIONS <- if (
    file.exists(METADATA_FILE)
) {
    metadata <- readr::read_csv(
        METADATA_FILE,
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

question_breaks <- seq_len(
    TOTAL_QUESTIONS
)

message(
    "Jumlah baris data tryout yang dianalisis: ",
    nrow(tryout_data)
)

message(
    "Jumlah siswa unik: ",
    dplyr::n_distinct(
        tryout_data$student_key
    )
)

# ============================================================
# 1. URUTAN KESULITAN YANG DITERIMA SISWA
# ============================================================

difficulty_sequence <- tryout_data |>
    dplyr::arrange(
        student_key,
        attempt_number,
        question_number
    ) |>
    dplyr::group_by(
        student_key,
        student_name,
        attempt_number
    ) |>
    dplyr::mutate(
        next_question_number =
            dplyr::lead(
                question_number
            ),
        next_difficulty =
            dplyr::lead(difficulty),
        next_question_id =
            dplyr::lead(question_id),
        next_weight =
            dplyr::lead(weight)
    ) |>
    dplyr::ungroup()

save_csv_table(
    difficulty_sequence,
    "urutan_soal_dan_kesulitan_siswa.csv"
)

# ============================================================
# 2. TRANSISI KESULITAN SETELAH JAWABAN
# ============================================================

difficulty_transitions <- difficulty_sequence |>
    dplyr::filter(
        !is.na(next_difficulty)
    ) |>
    dplyr::mutate(
        answer_result =
            dplyr::case_when(
                is_correct %in% TRUE ~
                    "Benar",
                is_correct %in% FALSE ~
                    "Salah",
                TRUE ~
                    "Tidak dijawab"
            ),
        transition = paste0(
            difficulty,
            " → ",
            next_difficulty
        )
    ) |>
    dplyr::count(
        attempt_number,
        difficulty,
        answer_result,
        next_difficulty,
        transition,
        name = "transition_count"
    ) |>
    dplyr::group_by(
        attempt_number,
        difficulty,
        answer_result
    ) |>
    dplyr::mutate(
        percentage =
            transition_count /
                sum(transition_count) *
                100
    ) |>
    dplyr::ungroup()

save_csv_table(
    difficulty_transitions,
    "transisi_kesulitan_setelah_jawaban.csv"
)

# ============================================================
# 3. RINGKASAN TRANSISI BERDASARKAN JAWABAN
# ============================================================

answer_transition_summary <- difficulty_sequence |>
    dplyr::filter(
        !is.na(next_difficulty)
    ) |>
    dplyr::mutate(
        current_level_value =
            dplyr::case_when(
                difficulty == "LOW" ~ 1,
                difficulty == "MEDIUM" ~ 2,
                difficulty == "HIGH" ~ 3,
                TRUE ~ NA_real_
            ),
        next_level_value =
            dplyr::case_when(
                next_difficulty == "LOW" ~ 1,
                next_difficulty == "MEDIUM" ~ 2,
                next_difficulty == "HIGH" ~ 3,
                TRUE ~ NA_real_
            ),
        level_change =
            next_level_value -
                current_level_value,
        answer_result =
            dplyr::case_when(
                is_correct %in% TRUE ~
                    "Benar",
                is_correct %in% FALSE ~
                    "Salah",
                TRUE ~
                    "Tidak dijawab"
            ),
        transition_category =
            dplyr::case_when(
                level_change > 0 ~
                    "Naik",
                level_change < 0 ~
                    "Turun",
                level_change == 0 ~
                    "Tetap",
                TRUE ~
                    NA_character_
            )
    ) |>
    dplyr::filter(
        !is.na(transition_category)
    ) |>
    dplyr::count(
        attempt_number,
        answer_result,
        transition_category,
        name = "transition_count"
    ) |>
    dplyr::group_by(
        attempt_number,
        answer_result
    ) |>
    dplyr::mutate(
        percentage =
            transition_count /
                sum(transition_count) *
                100
    ) |>
    dplyr::ungroup()

save_csv_table(
    answer_transition_summary,
    "ringkasan_transisi_berdasarkan_jawaban.csv"
)

# ============================================================
# 4. DISTRIBUSI KESULITAN BERDASARKAN NOMOR SOAL
# ============================================================

difficulty_by_position <- tryout_data |>
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
    difficulty_by_position,
    "distribusi_kesulitan_per_nomor.csv"
)

# ============================================================
# 5. AKURASI BERDASARKAN KESULITAN
# ============================================================

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
        mean_weight = mean(
            weight,
            na.rm = TRUE
        ),
        .groups = "drop"
    )

save_csv_table(
    difficulty_accuracy,
    "akurasi_kesulitan_adaptif.csv"
)

# ============================================================
# 6. KESESUAIAN LEVEL AWAL DAN SOAL PERTAMA
# ============================================================

first_question_check <- tryout_data |>
    dplyr::arrange(
        student_key,
        attempt_number,
        question_number
    ) |>
    dplyr::group_by(
        student_key,
        student_name,
        attempt_number
    ) |>
    dplyr::slice_head(n = 1) |>
    dplyr::ungroup() |>
    dplyr::mutate(
        initial_level_matches_first_question =
            initial_level ==
                difficulty
    )

first_question_summary <- first_question_check |>
    dplyr::group_by(
        attempt_number
    ) |>
    dplyr::summarise(
        total_sessions = dplyr::n(),
        matching_sessions = sum(
            initial_level_matches_first_question,
            na.rm = TRUE
        ),
        non_matching_sessions = sum(
            !initial_level_matches_first_question,
            na.rm = TRUE
        ),
        missing_comparison_sessions = sum(
            is.na(
                initial_level_matches_first_question
            )
        ),
        matching_percentage =
            dplyr::if_else(
                matching_sessions +
                    non_matching_sessions > 0,
                matching_sessions /
                    (matching_sessions +
                        non_matching_sessions) *
                    100,
                NA_real_
            ),
        .groups = "drop"
    )

save_csv_table(
    first_question_check,
    "pemeriksaan_level_awal_dan_soal_pertama.csv"
)

save_csv_table(
    first_question_summary,
    "ringkasan_kesesuaian_level_awal.csv"
)

# ============================================================
# 7. PERUBAHAN LEVEL AWAL DAN AKHIR
# ============================================================

session_level_change <- tryout_data |>
    dplyr::distinct(
        student_key,
        student_name,
        attempt_number,
        initial_level,
        final_level
    ) |>
    dplyr::mutate(
        initial_level_value =
            dplyr::case_when(
                initial_level == "LOW" ~ 1,
                initial_level == "MEDIUM" ~ 2,
                initial_level == "HIGH" ~ 3,
                TRUE ~ NA_real_
            ),
        final_level_value =
            dplyr::case_when(
                final_level == "LOW" ~ 1,
                final_level == "MEDIUM" ~ 2,
                final_level == "HIGH" ~ 3,
                TRUE ~ NA_real_
            ),
        level_difference =
            final_level_value -
                initial_level_value,
        level_change_category =
            dplyr::case_when(
                level_difference > 0 ~
                    "Meningkat",
                level_difference < 0 ~
                    "Menurun",
                level_difference == 0 ~
                    "Tetap",
                TRUE ~
                    NA_character_
            )
    )

session_level_change_summary <-
    session_level_change |>
    dplyr::filter(
        !is.na(level_change_category)
    ) |>
    dplyr::count(
        attempt_number,
        level_change_category,
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
    session_level_change,
    "perubahan_level_setiap_sesi.csv"
)

save_csv_table(
    session_level_change_summary,
    "ringkasan_perubahan_level_adaptif.csv"
)

# ============================================================
# 8. FREKUENSI SOAL TERPILIH
# ============================================================

question_frequency <- tryout_data |>
    dplyr::group_by(
        attempt_number,
        question_id,
        question_text,
        difficulty,
        weight
    ) |>
    dplyr::summarise(
        selection_count = dplyr::n(),
        unique_students =
            dplyr::n_distinct(
                student_key
            ),
        correct_count = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        wrong_count = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
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
        .groups = "drop"
    ) |>
    dplyr::arrange(
        attempt_number,
        dplyr::desc(
            selection_count
        )
    )

save_csv_table(
    question_frequency,
    "frekuensi_pemilihan_setiap_soal.csv"
)

# ============================================================
# 9. FREKUENSI PEMILIHAN BERDASARKAN BOBOT
# ============================================================

weight_selection <- tryout_data |>
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
    weight_selection,
    "frekuensi_pemilihan_berdasarkan_bobot.csv"
)

# ============================================================
# 10. AKURASI BERDASARKAN BOBOT
# ============================================================

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
    "akurasi_pemilihan_berdasarkan_bobot.csv"
)

# ============================================================
# 11. KORELASI BOBOT DAN FREKUENSI PEMILIHAN
# ============================================================

weight_frequency_correlation <-
    weight_selection |>
    dplyr::group_by(
        attempt_number
    ) |>
    dplyr::group_modify(
        function(data, group_key) {
            valid_data <- data |>
                dplyr::filter(
                    !is.na(weight),
                    !is.na(selection_count)
                )

            if (
                nrow(valid_data) < 3 ||
                    dplyr::n_distinct(
                        valid_data$weight
                    ) < 2
            ) {
                return(
                    tibble::tibble(
                        weight_categories =
                            nrow(valid_data),
                        correlation =
                            NA_real_,
                        p_value =
                            NA_real_,
                        interpretation =
                            "Data tidak mencukupi"
                    )
                )
            }

            correlation_test <-
                stats::cor.test(
                    valid_data$weight,
                    valid_data$selection_count,
                    method = "spearman",
                    exact = FALSE
                )

            correlation_value <-
                unname(
                    correlation_test$estimate
                )

            interpretation <-
                dplyr::case_when(
                    abs(correlation_value) < 0.20 ~
                        "Sangat lemah",
                    abs(correlation_value) < 0.40 ~
                        "Lemah",
                    abs(correlation_value) < 0.60 ~
                        "Sedang",
                    abs(correlation_value) < 0.80 ~
                        "Kuat",
                    TRUE ~
                        "Sangat kuat"
                )

            tibble::tibble(
                weight_categories =
                    nrow(valid_data),
                correlation =
                    correlation_value,
                p_value =
                    correlation_test$p.value,
                interpretation =
                    interpretation
            )
        }
    ) |>
    dplyr::ungroup()

save_csv_table(
    weight_frequency_correlation,
    "korelasi_bobot_dan_frekuensi.csv"
)

# ============================================================
# 12. VARIASI SOAL ANTAR PESERTA
# ============================================================

question_variation <- tryout_data |>
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
        variation_ratio =
            unique_questions /
                total_students,
        most_frequent_question_count =
            max(
                as.integer(
                    table(question_id)
                )
            ),
        most_frequent_question_percentage =
            most_frequent_question_count /
                total_students *
                100,
        .groups = "drop"
    )

save_csv_table(
    question_variation,
    "variasi_soal_antar_peserta.csv"
)

# ============================================================
# 13. AUDIT SOAL BERULANG DALAM SATU SESI
# ============================================================

repeated_question_audit <- tryout_data |>
    dplyr::count(
        student_key,
        student_name,
        attempt_number,
        question_id,
        name = "repetition_count"
    ) |>
    dplyr::filter(
        repetition_count > 1
    )

save_csv_table(
    repeated_question_audit,
    "audit_soal_berulang_dalam_sesi.csv"
)

# ============================================================
# 14. KEMIRIPAN PAKET SOAL ANTAR SISWA
# ============================================================

calculate_jaccard <- function(
  question_set_1,
  question_set_2
) {
    intersection_count <- length(
        intersect(
            question_set_1,
            question_set_2
        )
    )

    union_count <- length(
        union(
            question_set_1,
            question_set_2
        )
    )

    if (union_count == 0) {
        return(NA_real_)
    }

    intersection_count /
        union_count
}

calculate_pairwise_jaccard <- function(data) {
    question_sets <- split(
        data$question_id,
        data$student_key
    )

    question_sets <- lapply(
        question_sets,
        unique
    )

    student_keys <- names(
        question_sets
    )

    if (length(student_keys) < 2) {
        return(tibble::tibble())
    }

    student_pairs <- utils::combn(
        student_keys,
        2,
        simplify = FALSE
    )

    purrr::map_dfr(
        student_pairs,
        function(pair) {
            shared_questions <- intersect(
                question_sets[[pair[[1]]]],
                question_sets[[pair[[2]]]]
            )

            tibble::tibble(
                student_1 = pair[[1]],
                student_2 = pair[[2]],
                jaccard_similarity =
                    calculate_jaccard(
                        question_sets[[pair[[1]]]],
                        question_sets[[pair[[2]]]]
                    ),
                shared_question_count =
                    length(shared_questions)
            )
        }
    )
}

jaccard_details <- tryout_data |>
    dplyr::group_split(
        attempt_number
    ) |>
    purrr::map_dfr(
        function(attempt_data) {
            attempt_value <- unique(
                attempt_data$attempt_number
            )

            calculate_pairwise_jaccard(
                attempt_data
            ) |>
                dplyr::mutate(
                    attempt_number =
                        attempt_value,
                    .before = 1
                )
        }
    )

if (nrow(jaccard_details) > 0) {
    jaccard_summary <- jaccard_details |>
        dplyr::group_by(
            attempt_number
        ) |>
        dplyr::summarise(
            total_pairs = dplyr::n(),
            mean_similarity = mean(
                jaccard_similarity,
                na.rm = TRUE
            ),
            median_similarity =
                stats::median(
                    jaccard_similarity,
                    na.rm = TRUE
                ),
            minimum_similarity = min(
                jaccard_similarity,
                na.rm = TRUE
            ),
            maximum_similarity = max(
                jaccard_similarity,
                na.rm = TRUE
            ),
            mean_shared_questions = mean(
                shared_question_count,
                na.rm = TRUE
            ),
            .groups = "drop"
        )
} else {
    jaccard_summary <- tibble::tibble(
        attempt_number = integer(),
        total_pairs = integer(),
        mean_similarity = numeric(),
        median_similarity = numeric(),
        minimum_similarity = numeric(),
        maximum_similarity = numeric(),
        mean_shared_questions = numeric()
    )
}

save_csv_table(
    jaccard_details,
    "kemiripan_paket_soal_antar_siswa.csv"
)

save_csv_table(
    jaccard_summary,
    "ringkasan_kemiripan_paket_soal.csv"
)

# ============================================================
# 15. PEMERIKSAAN KETERSEDIAAN LOG INTERNAL WRS
# ============================================================

wrs_log_columns <- c(
    "selection_level",
    "candidate_count",
    "wrs_total_weight",
    "random_value"
)

complete_wrs_index <- stats::complete.cases(
    tryout_data[
        wrs_log_columns
    ]
)

complete_wrs_records <- sum(
    complete_wrs_index
)

has_wrs_log <-
    complete_wrs_records > 0

wrs_log_coverage_percentage <- if (
    nrow(tryout_data) > 0
) {
    complete_wrs_records /
        nrow(tryout_data) *
        100
} else {
    0
}

message(
    "Baris log WRS lengkap: ",
    complete_wrs_records,
    " dari ",
    nrow(tryout_data),
    " (",
    round(
        wrs_log_coverage_percentage,
        2
    ),
    "%)"
)

# ============================================================
# 16. ANALISIS LOG INTERNAL WRS
# ============================================================

if (has_wrs_log) {
    wrs_log_analysis <- tryout_data[
        complete_wrs_index,
    ] |>
        dplyr::filter(
            candidate_count > 0,
            wrs_total_weight > 0
        ) |>
        dplyr::mutate(
            theoretical_probability =
                weight /
                    wrs_total_weight,
            valid_candidate_count =
                candidate_count > 0,
            valid_total_weight =
                wrs_total_weight >=
                    weight,
            valid_random_value =
                random_value >= 0 &
                    random_value <=
                        wrs_total_weight,
            valid_probability =
                theoretical_probability > 0 &
                    theoretical_probability <= 1,
            selected_level_matches_question =
                selection_level ==
                    difficulty
        )

    wrs_validation_summary <-
        wrs_log_analysis |>
        dplyr::summarise(
            log_internal_available = TRUE,
            total_tryout_records =
                nrow(tryout_data),
            complete_log_records =
                dplyr::n(),
            log_coverage_percentage =
                complete_log_records /
                    total_tryout_records *
                    100,
            valid_candidate_percentage =
                mean(
                    valid_candidate_count,
                    na.rm = TRUE
                ) * 100,
            valid_total_weight_percentage =
                mean(
                    valid_total_weight,
                    na.rm = TRUE
                ) * 100,
            valid_random_value_percentage =
                mean(
                    valid_random_value,
                    na.rm = TRUE
                ) * 100,
            valid_probability_percentage =
                mean(
                    valid_probability,
                    na.rm = TRUE
                ) * 100,
            selected_level_match_percentage =
                mean(
                    selected_level_matches_question,
                    na.rm = TRUE
                ) * 100,
            mean_theoretical_probability =
                mean(
                    theoretical_probability,
                    na.rm = TRUE
                ),
            information = paste(
                "Validasi dilakukan menggunakan",
                "log internal proses pemilihan WRS."
            )
        )

    wrs_validation_by_attempt <-
        wrs_log_analysis |>
        dplyr::group_by(
            attempt_number
        ) |>
        dplyr::summarise(
            complete_log_records =
                dplyr::n(),
            valid_candidate_percentage =
                mean(
                    valid_candidate_count,
                    na.rm = TRUE
                ) * 100,
            valid_total_weight_percentage =
                mean(
                    valid_total_weight,
                    na.rm = TRUE
                ) * 100,
            valid_random_value_percentage =
                mean(
                    valid_random_value,
                    na.rm = TRUE
                ) * 100,
            valid_probability_percentage =
                mean(
                    valid_probability,
                    na.rm = TRUE
                ) * 100,
            selected_level_match_percentage =
                mean(
                    selected_level_matches_question,
                    na.rm = TRUE
                ) * 100,
            mean_theoretical_probability =
                mean(
                    theoretical_probability,
                    na.rm = TRUE
                ),
            .groups = "drop"
        )
} else {
    wrs_log_analysis <- tibble::tibble(
        student_key = character(),
        student_name = character(),
        attempt_number = integer(),
        question_number = integer(),
        question_id = character(),
        difficulty = character(),
        weight = numeric(),
        selection_level = character(),
        candidate_count = integer(),
        wrs_total_weight = numeric(),
        random_value = numeric(),
        theoretical_probability = numeric(),
        valid_candidate_count = logical(),
        valid_total_weight = logical(),
        valid_random_value = logical(),
        valid_probability = logical(),
        selected_level_matches_question = logical()
    )

    wrs_validation_summary <-
        tibble::tibble(
            log_internal_available = FALSE,
            total_tryout_records =
                nrow(tryout_data),
            complete_log_records = 0L,
            log_coverage_percentage = 0,
            valid_candidate_percentage =
                NA_real_,
            valid_total_weight_percentage =
                NA_real_,
            valid_random_value_percentage =
                NA_real_,
            valid_probability_percentage =
                NA_real_,
            selected_level_match_percentage =
                NA_real_,
            mean_theoretical_probability =
                NA_real_,
            information = paste(
                "Log internal WRS tidak tersedia",
                "secara lengkap."
            )
        )

    wrs_validation_by_attempt <-
        tibble::tibble(
            attempt_number = integer(),
            complete_log_records = integer(),
            valid_candidate_percentage = numeric(),
            valid_total_weight_percentage = numeric(),
            valid_random_value_percentage = numeric(),
            valid_probability_percentage = numeric(),
            selected_level_match_percentage = numeric(),
            mean_theoretical_probability = numeric()
        )
}

save_csv_table(
    wrs_log_analysis,
    "analisis_log_wrs.csv"
)

save_csv_table(
    wrs_validation_summary,
    "validasi_log_wrs.csv"
)

save_csv_table(
    wrs_validation_by_attempt,
    "validasi_log_wrs_per_percobaan.csv"
)

# ============================================================
# 17. GRAFIK VARIASI SOAL
# ============================================================

variation_plot <- ggplot2::ggplot(
    question_variation,
    ggplot2::aes(
        x = question_number,
        y = unique_questions,
        linetype = factor(
            attempt_number
        ),
        group = factor(
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
        breaks = question_breaks
    ) +
    ggplot2::labs(
        title = "Variasi Soal pada Setiap Nomor",
        x = "Nomor Soal",
        y = "Jumlah Soal Berbeda",
        linetype = "Percobaan"
    )

save_figure(
    variation_plot,
    "variasi_soal_per_nomor.png"
)

# ============================================================
# 18. GRAFIK FREKUENSI PEMILIHAN BERDASARKAN BOBOT
# ============================================================

weight_frequency_plot <- ggplot2::ggplot(
    weight_selection,
    ggplot2::aes(
        x = weight,
        y = selection_count
    )
) +
    ggplot2::geom_point(
        size = 3
    ) +
    ggplot2::geom_line() +
    ggplot2::facet_wrap(
        ~attempt_number
    ) +
    ggplot2::scale_x_continuous(
        breaks = sort(
            unique(
                weight_selection$weight
            )
        )
    ) +
    ggplot2::labs(
        title = "Frekuensi Pemilihan Berdasarkan Bobot",
        subtitle = paste(
            "Menunjukkan hasil pemilihan yang teramati,",
            "bukan probabilitas internal setiap undian"
        ),
        x = "Bobot Soal",
        y = "Frekuensi Pemilihan"
    )

save_figure(
    weight_frequency_plot,
    "frekuensi_pemilihan_berdasarkan_bobot.png"
)

# ============================================================
# 19. GRAFIK DISTRIBUSI KESULITAN PER NOMOR
# ============================================================

difficulty_position_plot <- ggplot2::ggplot(
    difficulty_by_position,
    ggplot2::aes(
        x = question_number,
        y = percentage,
        fill = difficulty
    )
) +
    ggplot2::geom_col() +
    ggplot2::facet_wrap(
        ~attempt_number
    ) +
    ggplot2::scale_x_continuous(
        breaks = question_breaks
    ) +
    ggplot2::labs(
        title = "Distribusi Kesulitan Berdasarkan Nomor Soal",
        x = "Nomor Soal",
        y = "Persentase",
        fill = "Kesulitan"
    )

save_figure(
    difficulty_position_plot,
    "distribusi_kesulitan_per_nomor.png"
)

# ============================================================
# 20. GRAFIK AKURASI BERDASARKAN KESULITAN
# ============================================================

difficulty_accuracy_plot <- ggplot2::ggplot(
    difficulty_accuracy,
    ggplot2::aes(
        x = difficulty,
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
        size = 3
    ) +
    ggplot2::labs(
        title = "Akurasi Berdasarkan Tingkat Kesulitan",
        x = "Tingkat Kesulitan",
        y = "Akurasi (%)",
        linetype = "Percobaan"
    )

save_figure(
    difficulty_accuracy_plot,
    "akurasi_berdasarkan_kesulitan_adaptif.png"
)

# ============================================================
# 21. WORKBOOK ANALISIS ADAPTIF DAN WRS
# ============================================================

adaptive_workbook <- list(
    Urutan_Kesulitan =
        difficulty_sequence,
    Transisi_Kesulitan =
        difficulty_transitions,
    Ringkasan_Transisi =
        answer_transition_summary,
    Kesulitan_Per_Nomor =
        difficulty_by_position,
    Akurasi_Kesulitan =
        difficulty_accuracy,
    Level_Awal =
        first_question_summary,
    Perubahan_Level =
        session_level_change,
    Ringkasan_Level =
        session_level_change_summary,
    Frekuensi_Soal =
        question_frequency,
    Frekuensi_Bobot =
        weight_selection,
    Akurasi_Bobot =
        weight_accuracy,
    Korelasi_Bobot =
        weight_frequency_correlation,
    Variasi_Soal =
        question_variation,
    Kemiripan_Paket =
        jaccard_summary,
    Audit_Soal_Berulang =
        repeated_question_audit,
    Validasi_WRS =
        wrs_validation_summary,
    Validasi_WRS_Percobaan =
        wrs_validation_by_attempt,
    Log_WRS =
        wrs_log_analysis
)

writexl::write_xlsx(
    adaptive_workbook,
    here::here(
        "analytics",
        "output",
        "tables",
        "hasil_analisis_adaptif_wrs.xlsx"
    )
)

message("")
message("================================================")
message("ANALISIS MEKANISME ADAPTIF DAN WRS SELESAI")
message("================================================")
message(
    "Jumlah sesi yang diperiksa: ",
    nrow(first_question_check)
)
message(
    "Jumlah posisi soal yang dianalisis: ",
    nrow(question_variation)
)
message(
    "Jumlah pasangan siswa pada analisis Jaccard: ",
    nrow(jaccard_details)
)
message(
    "Log internal WRS tersedia: ",
    has_wrs_log
)
message(
    "Cakupan log internal WRS: ",
    round(
        wrs_log_coverage_percentage,
        2
    ),
    "%"
)
message("================================================")
