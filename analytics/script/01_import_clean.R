# ============================================================
# 01_import_clean.R
# Import dan pembersihan data tryout JSON serta kuesioner siswa
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

# ============================================================
# KONFIGURASI FILE
# ============================================================

TRYOUT_FILE <- here::here(
    "analytics",
    "data",
    "raw",
    "tryout-biologi-kelas-10-semua-percobaan.json"
)

STUDENT_QUESTIONNAIRE_FILE <- here::here(
    "analytics",
    "data",
    "raw",
    "rekap_uji_coba_tryout_wira_lengkap.xlsx"
)

TARGET_ATTEMPTS <- c(1L, 2L)
EXCLUDED_STUDENT_NAME <- "Dian Meylani Pratiwi"

# Isi setelah memeriksa file pemetaan item apabila ada
# pernyataan negatif yang harus dibalik skornya.
REVERSE_ITEMS_STUDENT <- character(0)

# ============================================================
# OPERATOR DAN FUNGSI DASAR
# ============================================================

`%||%` <- function(x, y) {
    if (
        is.null(x) ||
            length(x) == 0 ||
            all(is.na(x))
    ) {
        y
    } else {
        x
    }
}

get_column_value <- function(
  data,
  column_name,
  default = NA_character_
) {
    if (
        length(column_name) == 0 ||
            is.na(column_name) ||
            !column_name %in% names(data)
    ) {
        return(
            rep(
                default,
                nrow(data)
            )
        )
    }

    data[[column_name]]
}

find_column <- function(
  data,
  candidates,
  required = FALSE,
  label = NULL
) {
    exact_match <- intersect(
        candidates,
        names(data)
    )

    if (length(exact_match) > 0) {
        return(exact_match[[1]])
    }

    if (required) {
        stop(
            "Kolom ",
            label %||% paste(candidates, collapse = "/"),
            " tidak ditemukan.\n\nKolom tersedia:\n",
            paste(names(data), collapse = ", ")
        )
    }

    NA_character_
}

normalize_level <- function(x) {
    value <- x |>
        as.character() |>
        stringr::str_to_lower() |>
        stringr::str_squish()

    dplyr::case_when(
        value %in% c(
            "low",
            "mudah",
            "rendah",
            "easy"
        ) ~ "LOW",
        value %in% c(
            "medium",
            "sedang",
            "normal",
            "moderate"
        ) ~ "MEDIUM",
        value %in% c(
            "high",
            "sulit",
            "tinggi",
            "hard"
        ) ~ "HIGH",
        TRUE ~ NA_character_
    )
}

parse_boolean <- function(x) {
    if (is.logical(x)) {
        return(x)
    }

    if (is.numeric(x)) {
        return(
            dplyr::case_when(
                x == 1 ~ TRUE,
                x == 0 ~ FALSE,
                TRUE ~ NA
            )
        )
    }

    value <- x |>
        as.character() |>
        stringr::str_to_lower() |>
        stringr::str_squish()

    dplyr::case_when(
        value %in% c(
            "true",
            "benar",
            "correct",
            "betul",
            "ya",
            "yes",
            "1"
        ) ~ TRUE,
        value %in% c(
            "false",
            "salah",
            "incorrect",
            "tidak",
            "no",
            "0"
        ) ~ FALSE,
        TRUE ~ NA
    )
}

parse_numeric_value <- function(x) {
    suppressWarnings(
        readr::parse_number(
            as.character(x)
        )
    )
}

# ============================================================
# MEMBACA RAW DATA TRYOUT DARI JSON
# ============================================================

read_tryout_json <- function(file_path) {
    if (!file.exists(file_path)) {
        stop(
            "File JSON tryout tidak ditemukan: ",
            file_path
        )
    }

    raw_json <- jsonlite::read_json(
        file_path,
        simplifyVector = FALSE
    )

    attempts <- raw_json$attempts

    if (
        is.null(attempts) ||
            length(attempts) == 0
    ) {
        stop("JSON tidak memiliki data attempts.")
    }

    tryout_rows <- purrr::imap_dfr(
        attempts,
        function(
          attempt_data,
          attempt_index
        ) {
            parent_attempt_number <- as.integer(
                purrr::pluck(
                    attempt_data,
                    "attemptNumber",
                    .default = attempt_index
                )
            )

            questions <- purrr::pluck(
                attempt_data,
                "questions",
                .default = list()
            )

            if (length(questions) == 0) {
                return(tibble::tibble())
            }

            purrr::imap_dfr(
                questions,
                function(
                  question_data,
                  question_index
                ) {
                    parent_question_number <- as.integer(
                        purrr::pluck(
                            question_data,
                            "questionNumber",
                            .default = question_index
                        )
                    )

                    items <- purrr::pluck(
                        question_data,
                        "items",
                        .default = list()
                    )

                    if (length(items) == 0) {
                        return(tibble::tibble())
                    }

                    purrr::map_dfr(
                        items,
                        function(item) {
                            tibble::tibble(
                                student_id = as.character(
                                    purrr::pluck(
                                        item,
                                        "student",
                                        "id",
                                        .default = NA_character_
                                    )
                                ),
                                student_name = as.character(
                                    purrr::pluck(
                                        item,
                                        "student",
                                        "name",
                                        .default = NA_character_
                                    )
                                ),
                                attempt_number = as.integer(
                                    purrr::pluck(
                                        item,
                                        "attemptNumber",
                                        .default = parent_attempt_number
                                    )
                                ),
                                question_number = as.integer(
                                    purrr::pluck(
                                        item,
                                        "questionNumber",
                                        .default = parent_question_number
                                    )
                                ),
                                question_id = as.character(
                                    purrr::pluck(
                                        item,
                                        "question",
                                        "id",
                                        .default = NA_character_
                                    )
                                ),
                                question_text = as.character(
                                    purrr::pluck(
                                        item,
                                        "question",
                                        "questionText",
                                        .default = NA_character_
                                    )
                                ),
                                difficulty = as.character(
                                    purrr::pluck(
                                        item,
                                        "question",
                                        "difficultyLevel",
                                        .default = NA_character_
                                    )
                                ),
                                weight = as.numeric(
                                    purrr::pluck(
                                        item,
                                        "question",
                                        "weight",
                                        .default = NA_real_
                                    )
                                ),
                                answer_key = as.character(
                                    purrr::pluck(
                                        item,
                                        "question",
                                        "correctAnswer",
                                        .default = NA_character_
                                    )
                                ),
                                is_correct = as.logical(
                                    purrr::pluck(
                                        item,
                                        "answer",
                                        "isCorrect",
                                        .default = NA
                                    )
                                ),
                                initial_level = as.character(
                                    purrr::pluck(
                                        item,
                                        "initialLevel",
                                        .default = NA_character_
                                    )
                                ),
                                final_level = as.character(
                                    purrr::pluck(
                                        item,
                                        "finalLevel",
                                        .default = NA_character_
                                    )
                                ),
                                selection_level = as.character(
                                    purrr::pluck(
                                        item,
                                        "selection",
                                        "currentLevel",
                                        .default = NA_character_
                                    )
                                ),
                                candidate_count = as.integer(
                                    purrr::pluck(
                                        item,
                                        "selection",
                                        "candidateCount",
                                        .default = NA_integer_
                                    )
                                ),
                                wrs_total_weight = as.numeric(
                                    purrr::pluck(
                                        item,
                                        "selection",
                                        "totalWeight",
                                        .default = NA_real_
                                    )
                                ),
                                random_value = as.numeric(
                                    purrr::pluck(
                                        item,
                                        "selection",
                                        "randomValue",
                                        .default = NA_real_
                                    )
                                )
                            )
                        }
                    )
                }
            )
        }
    )

    if (nrow(tryout_rows) == 0) {
        stop(
            paste(
                "Tidak ada data item tryout",
                "yang berhasil dibaca dari JSON."
            )
        )
    }

    total_questions <- as.integer(
        purrr::pluck(
            raw_json,
            "tryout",
            "totalQuestions",
            .default = max(
                tryout_rows$question_number,
                na.rm = TRUE
            )
        )
    )

    available_attempts <- purrr::pluck(
        raw_json,
        "availableAttempts",
        .default = sort(
            unique(
                tryout_rows$attempt_number
            )
        )
    ) |>
        unlist(use.names = FALSE) |>
        as.integer()

    metadata <- tibble::tibble(
        tryout_id = as.character(
            purrr::pluck(
                raw_json,
                "tryout",
                "id",
                .default = NA_character_
            )
        ),
        tryout_title = as.character(
            purrr::pluck(
                raw_json,
                "tryout",
                "title",
                .default = NA_character_
            )
        ),
        bank_name = as.character(
            purrr::pluck(
                raw_json,
                "tryout",
                "bankName",
                .default = NA_character_
            )
        ),
        total_questions = total_questions,
        total_attempts = length(
            unique(available_attempts)
        ),
        available_attempts = paste(
            sort(unique(available_attempts)),
            collapse = ","
        ),
        generated_at = as.character(
            purrr::pluck(
                raw_json,
                "generatedAt",
                .default = NA_character_
            )
        ),
        source = as.character(
            purrr::pluck(
                raw_json,
                "source",
                .default = NA_character_
            )
        )
    )

    message(
        "Jumlah baris tryout dari JSON: ",
        nrow(tryout_rows)
    )

    message(
        "Jumlah percobaan dari JSON: ",
        dplyr::n_distinct(
            tryout_rows$attempt_number
        )
    )

    message(
        "Jumlah siswa dari JSON: ",
        dplyr::n_distinct(
            tryout_rows$student_id
        )
    )

    list(
        data = tryout_rows,
        metadata = metadata,
        total_questions = total_questions,
        available_attempts = available_attempts
    )
}

# ============================================================
# MEMBACA DAN MEMBERSIHKAN DATA TRYOUT
# ============================================================

tryout_json <- read_tryout_json(
    TRYOUT_FILE
)

tryout_raw <- tryout_json$data |>
    janitor::clean_names()

tryout_metadata <- tryout_json$metadata
TOTAL_QUESTIONS <- tryout_json$total_questions
AVAILABLE_ATTEMPTS <- tryout_json$available_attempts

if (
    is.na(TOTAL_QUESTIONS) ||
        TOTAL_QUESTIONS <= 0
) {
    stop("Jumlah soal pada metadata JSON tidak valid.")
}

message("\nKolom data tryout JSON:")
print(names(tryout_raw))

tryout_clean <- tryout_raw |>
    dplyr::transmute(
        student_id = as.character(student_id),
        student_name = stringr::str_squish(
            as.character(student_name)
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
        question_text = stringr::str_squish(
            as.character(question_text)
        ),
        difficulty = normalize_level(
            difficulty
        ),
        weight = as.numeric(weight),
        answer_key = stringr::str_to_upper(
            stringr::str_squish(
                as.character(answer_key)
            )
        ),
        is_correct = parse_boolean(
            is_correct
        ),
        initial_level = normalize_level(
            initial_level
        ),
        final_level = normalize_level(
            final_level
        ),
        selection_level = normalize_level(
            selection_level
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
        !is.na(student_name),
        student_name != "",
        !is.na(attempt_number),
        attempt_number %in% TARGET_ATTEMPTS,
        !is.na(question_number),
        question_number >= 1,
        question_number <= TOTAL_QUESTIONS,
        !is.na(question_text),
        question_text != "",
        !is.na(difficulty),
        !is.na(weight)
    ) |>
    dplyr::filter(
        normalize_key(student_name) !=
            normalize_key(
                EXCLUDED_STUDENT_NAME
            )
    ) |>
    dplyr::mutate(
        student_key = dplyr::if_else(
            !is.na(student_id) &
                student_id != "",
            normalize_key(student_id),
            normalize_key(student_name)
        )
    )

# Membuat ID soal otomatis apabila kosong.
missing_question_id <- is.na(
    tryout_clean$question_id
) |
    tryout_clean$question_id == ""

generated_question_ids <- paste0(
    "AUTO_Q",
    sprintf(
        "%03d",
        match(
            tryout_clean$question_text,
            unique(
                tryout_clean$question_text
            )
        )
    )
)

tryout_clean$question_id[
    missing_question_id
] <- generated_question_ids[
    missing_question_id
]

# ============================================================
# AUDIT DUPLIKASI POSISI SOAL
# ============================================================

duplicate_position_audit <- tryout_clean |>
    dplyr::count(
        student_key,
        student_name,
        attempt_number,
        question_number,
        name = "duplicate_count"
    ) |>
    dplyr::filter(
        duplicate_count > 1
    )

# Menyisakan satu baris per siswa, percobaan, dan nomor soal.
tryout_clean <- tryout_clean |>
    dplyr::arrange(
        student_name,
        attempt_number,
        question_number
    ) |>
    dplyr::distinct(
        student_key,
        attempt_number,
        question_number,
        .keep_all = TRUE
    )

# Menghitung total bobot dalam satu sesi siswa.
tryout_clean <- tryout_clean |>
    dplyr::group_by(
        student_key,
        student_name,
        attempt_number
    ) |>
    dplyr::mutate(
        session_total_weight = sum(
            weight,
            na.rm = TRUE
        ),
        session_weight_correct = sum(
            dplyr::if_else(
                is_correct %in% TRUE,
                weight,
                0
            ),
            na.rm = TRUE
        )
    ) |>
    dplyr::ungroup()

# ============================================================
# AUDIT KETERSEDIAAN LOG INTERNAL WRS
# ============================================================

wrs_log_columns <- c(
    "selection_level",
    "candidate_count",
    "wrs_total_weight",
    "random_value"
)

complete_wrs_rows <- sum(
    stats::complete.cases(
        tryout_clean[
            wrs_log_columns
        ]
    )
)

wrs_log_availability <- tibble::tibble(
    total_tryout_rows = nrow(
        tryout_clean
    ),
    complete_wrs_rows = complete_wrs_rows,
    wrs_log_coverage_percentage =
        if (nrow(tryout_clean) > 0) {
            complete_wrs_rows /
                nrow(tryout_clean) *
                100
        } else {
            0
        },
    selection_level_non_missing = sum(
        !is.na(
            tryout_clean$selection_level
        )
    ),
    candidate_count_non_missing = sum(
        !is.na(
            tryout_clean$candidate_count
        )
    ),
    wrs_total_weight_non_missing = sum(
        !is.na(
            tryout_clean$wrs_total_weight
        )
    ),
    random_value_non_missing = sum(
        !is.na(
            tryout_clean$random_value
        )
    )
)

# ============================================================
# AUDIT KELENGKAPAN SESI TRYOUT
# ============================================================

session_audit <- tryout_clean |>
    dplyr::group_by(
        student_key,
        student_name,
        attempt_number
    ) |>
    dplyr::summarise(
        total_rows = dplyr::n(),
        unique_question_numbers =
            dplyr::n_distinct(
                question_number
            ),
        unique_question_ids =
            dplyr::n_distinct(
                question_id
            ),
        missing_answers = sum(
            is.na(is_correct)
        ),
        total_correct = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        total_wrong = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
        ),
        .groups = "drop"
    ) |>
    dplyr::mutate(
        expected_questions = TOTAL_QUESTIONS,
        complete_session =
            unique_question_numbers ==
                expected_questions &
                missing_answers == 0
    )

# ============================================================
# AUDIT IDENTITAS NAMA
# ============================================================

potential_name_duplicates <- tryout_clean |>
    dplyr::distinct(
        student_key,
        student_name
    ) |>
    dplyr::mutate(
        simplified_name =
            normalize_key(student_name)
    ) |>
    dplyr::count(
        simplified_name,
        name = "name_count"
    ) |>
    dplyr::filter(
        name_count > 1
    )

# ============================================================
# RINGKASAN SISWA DARI DATA TRYOUT JSON
# ============================================================

ringkasan_siswa_clean <- tryout_clean |>
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
        available_questions =
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
        session_total_weight = sum(
            weight,
            na.rm = TRUE
        ),
        session_weight_correct = sum(
            dplyr::if_else(
                is_correct %in% TRUE,
                weight,
                0
            ),
            na.rm = TRUE
        ),
        .groups = "drop"
    ) |>
    dplyr::mutate(
        unavailable_count = pmax(
            TOTAL_QUESTIONS -
                available_questions,
            0L
        ),
        accuracy = dplyr::if_else(
            available_questions > 0,
            correct_count /
                available_questions *
                100,
            NA_real_
        ),
        weighted_accuracy =
            dplyr::if_else(
                session_total_weight > 0,
                session_weight_correct /
                    session_total_weight *
                    100,
                NA_real_
            )
    )

# ============================================================
# RINGKASAN NOMOR SOAL DARI DATA TRYOUT JSON
# ============================================================

ringkasan_no_soal_clean <- tryout_clean |>
    dplyr::group_by(
        attempt_number,
        question_number
    ) |>
    dplyr::summarise(
        available_data = dplyr::n(),
        total_students =
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
        unanswered_count = sum(
            is.na(is_correct)
        ),
        low_count = sum(
            difficulty == "LOW",
            na.rm = TRUE
        ),
        medium_count = sum(
            difficulty == "MEDIUM",
            na.rm = TRUE
        ),
        high_count = sum(
            difficulty == "HIGH",
            na.rm = TRUE
        ),
        total_selected_weight = sum(
            weight,
            na.rm = TRUE
        ),
        correct_selected_weight = sum(
            dplyr::if_else(
                is_correct %in% TRUE,
                weight,
                0
            ),
            na.rm = TRUE
        ),
        .groups = "drop"
    ) |>
    dplyr::mutate(
        answered_count =
            correct_count +
                wrong_count,
        accuracy = dplyr::if_else(
            answered_count > 0,
            correct_count /
                answered_count *
                100,
            NA_real_
        ),
        weighted_accuracy =
            dplyr::if_else(
                total_selected_weight > 0,
                correct_selected_weight /
                    total_selected_weight *
                    100,
                NA_real_
            )
    )

# ============================================================
# MENYIMPAN DATA TRYOUT DAN AUDIT
# ============================================================

save_processed_csv(
    tryout_clean,
    "tryout_clean.csv"
)

save_processed_csv(
    ringkasan_siswa_clean,
    "ringkasan_siswa_clean.csv"
)

save_processed_csv(
    ringkasan_no_soal_clean,
    "ringkasan_no_soal_clean.csv"
)

save_processed_csv(
    tryout_metadata,
    "metadata_tryout.csv"
)

save_csv_table(
    tryout_metadata,
    "metadata_tryout.csv"
)

save_csv_table(
    wrs_log_availability,
    "audit_ketersediaan_log_wrs.csv"
)

save_csv_table(
    session_audit,
    "audit_sesi_tryout.csv"
)

save_csv_table(
    duplicate_position_audit,
    "audit_duplikasi_posisi_soal.csv"
)

save_csv_table(
    potential_name_duplicates,
    "audit_kemungkinan_nama_ganda.csv"
)

# ============================================================
# FUNGSI PEMBERSIHAN KUESIONER SISWA
# ============================================================

parse_likert <- function(x) {
    if (is.numeric(x)) {
        result <- as.numeric(x)
        result[!result %in% 1:5] <- NA_real_
        return(result)
    }

    value <- stringr::str_squish(
        as.character(x)
    )

    direct_number <- suppressWarnings(
        as.numeric(value)
    )

    extracted_number <- suppressWarnings(
        as.numeric(
            stringr::str_extract(
                value,
                "(?<![0-9])[1-5](?![0-9])"
            )
        )
    )

    result <- dplyr::coalesce(
        direct_number,
        extracted_number
    )

    result[!result %in% 1:5] <- NA_real_
    result
}

detect_likert_columns <- function(data) {
    q_columns <- names(data)[
        stringr::str_detect(
            names(data),
            "^q[0-9]+$"
        )
    ]

    if (length(q_columns) > 0) {
        question_numbers <- as.integer(
            stringr::str_extract(
                q_columns,
                "[0-9]+"
            )
        )

        return(
            q_columns[
                order(question_numbers)
            ]
        )
    }

    excluded_pattern <- paste(
        c(
            "timestamp",
            "stempel_waktu",
            "waktu",
            "tanggal",
            "nama",
            "name",
            "email",
            "kelas",
            "class",
            "sekolah",
            "school",
            "jenis_kelamin",
            "gender",
            "usia",
            "umur",
            "role",
            "peran"
        ),
        collapse = "|"
    )

    candidate_columns <- names(data)[
        !stringr::str_detect(
            names(data),
            excluded_pattern
        )
    ]

    candidate_columns[
        vapply(
            candidate_columns,
            function(column_name) {
                parsed <- parse_likert(
                    data[[column_name]]
                )

                original_non_missing <- sum(
                    !is.na(data[[column_name]]) &
                        as.character(
                            data[[column_name]]
                        ) != ""
                )

                parsed_non_missing <- sum(
                    !is.na(parsed)
                )

                if (original_non_missing == 0) {
                    return(FALSE)
                }

                parsed_ratio <-
                    parsed_non_missing /
                        original_non_missing

                parsed_ratio >= 0.80 &&
                    parsed_non_missing >= 1
            },
            logical(1)
        )
    ]
}

parse_timestamp_column <- function(x) {
    if (inherits(x, "POSIXt")) {
        return(
            as.POSIXct(
                x,
                tz = "Asia/Makassar"
            )
        )
    }

    suppressWarnings(
        lubridate::parse_date_time(
            as.character(x),
            orders = c(
                "Ymd HMS",
                "Ymd HM",
                "dmY HMS",
                "dmY HM",
                "mdY HMS",
                "mdY HM",
                "dmy HMS",
                "dmy HM"
            ),
            tz = "Asia/Makassar",
            quiet = TRUE
        )
    )
}

clean_student_questionnaire <- function(
  file_path,
  reverse_items = character(0)
) {
    if (!file.exists(file_path)) {
        message(
            "File kuesioner siswa tidak ditemukan dan dilewati: ",
            file_path
        )

        return(NULL)
    }

    raw_data <- readxl::read_excel(
        file_path,
        sheet = "Kuesioner",
        range = "A4:AB40"
    ) |>
        janitor::clean_names()

    message("\nKolom kuesioner siswa:")
    print(names(raw_data))

    timestamp_column <- find_column(
        raw_data,
        c(
            "timestamp",
            "stempel_waktu",
            "waktu_pengisian",
            "tanggal_pengisian",
            "submitted_at",
            "created_at"
        )
    )

    email_column <- find_column(
        raw_data,
        c(
            "email",
            "alamat_email",
            "email_address"
        )
    )

    name_column <- find_column(
        raw_data,
        c(
            "nama",
            "name",
            "nama_lengkap",
            "nama_siswa",
            "responden"
        ),
        required = TRUE,
        label = "nama responden"
    )

    class_column <- find_column(
        raw_data,
        c(
            "kelas",
            "class",
            "kelas_siswa"
        )
    )

    school_column <- find_column(
        raw_data,
        c(
            "sekolah",
            "school",
            "nama_sekolah"
        )
    )

    likert_columns <- detect_likert_columns(
        raw_data
    )

    if (length(likert_columns) == 0) {
        stop(
            "Tidak ada kolom Likert 1-5 yang terdeteksi pada ",
            basename(file_path)
        )
    }

    item_names <- paste0(
        "item_",
        sprintf(
            "%02d",
            seq_along(likert_columns)
        )
    )

    item_mapping <- tibble::tibble(
        item = item_names,
        original_column = likert_columns,
        statement = stringr::str_replace_all(
            likert_columns,
            "_",
            " "
        )
    )

    item_data <- purrr::map_dfc(
        likert_columns,
        function(column_name) {
            tibble::tibble(
                value = parse_likert(
                    raw_data[[column_name]]
                )
            )
        }
    )

    names(item_data) <- item_names

    timestamp_value <- get_column_value(
        raw_data,
        timestamp_column
    )

    questionnaire_clean <- tibble::tibble(
        original_row = seq_len(
            nrow(raw_data)
        ),
        timestamp = parse_timestamp_column(
            timestamp_value
        ),
        respondent_name = stringr::str_squish(
            as.character(
                get_column_value(
                    raw_data,
                    name_column
                )
            )
        ),
        email = stringr::str_to_lower(
            stringr::str_squish(
                as.character(
                    get_column_value(
                        raw_data,
                        email_column
                    )
                )
            )
        ),
        class = stringr::str_squish(
            as.character(
                get_column_value(
                    raw_data,
                    class_column
                )
            )
        ),
        school = stringr::str_squish(
            as.character(
                get_column_value(
                    raw_data,
                    school_column
                )
            )
        )
    ) |>
        dplyr::bind_cols(
            item_data
        ) |>
        dplyr::filter(
            is.na(respondent_name) |
                normalize_key(respondent_name) !=
                    normalize_key(
                        EXCLUDED_STUDENT_NAME
                    )
        ) |>
        dplyr::mutate(
            respondent_key =
                dplyr::case_when(
                    !is.na(email) &
                        email != "" ~
                        normalize_key(email),
                    !is.na(respondent_name) &
                        respondent_name != "" ~
                        normalize_key(
                            respondent_name
                        ),
                    TRUE ~ paste0(
                        "siswa_row_",
                        original_row
                    )
                )
        )

    item_columns <- names(
        questionnaire_clean
    )[
        stringr::str_detect(
            names(questionnaire_clean),
            "^item_"
        )
    ]

    non_missing_count <- rowSums(
        !is.na(
            questionnaire_clean[
                item_columns
            ]
        )
    )

    one_count <- rowSums(
        questionnaire_clean[
            item_columns
        ] == 1,
        na.rm = TRUE
    )

    questionnaire_clean <- questionnaire_clean |>
        dplyr::mutate(
            valid_response =
                non_missing_count ==
                    length(item_columns),
            all_one_response =
                non_missing_count > 0 &
                    one_count ==
                        non_missing_count
        ) |>
        dplyr::filter(
            valid_response,
            !is.na(respondent_name),
            respondent_name != ""
        ) |>
        dplyr::mutate(
            timestamp_sort =
                dplyr::coalesce(
                    timestamp,
                    as.POSIXct(
                        "1900-01-01 00:00:00",
                        tz = "Asia/Makassar"
                    )
                )
        ) |>
        dplyr::arrange(
            respondent_key,
            timestamp_sort,
            original_row
        ) |>
        dplyr::group_by(
            respondent_key
        ) |>
        dplyr::mutate(
            duplicate_count =
                dplyr::n(),
            kept_record =
                dplyr::row_number() ==
                    dplyr::n()
        ) |>
        dplyr::ungroup()

    duplicate_audit <- questionnaire_clean |>
        dplyr::filter(
            duplicate_count > 1
        )

    all_one_audit <- questionnaire_clean |>
        dplyr::filter(
            all_one_response
        ) |>
        dplyr::select(
            original_row,
            timestamp,
            respondent_name,
            email,
            class,
            school,
            respondent_key,
            duplicate_count,
            kept_record,
            all_one_response,
            dplyr::all_of(
                item_columns
            )
        )

    questionnaire_final <- questionnaire_clean |>
        dplyr::filter(
            kept_record
        ) |>
        dplyr::select(
            -timestamp_sort,
            -kept_record,
            -valid_response
        )

    valid_reverse_items <- intersect(
        reverse_items,
        item_columns
    )

    if (length(valid_reverse_items) > 0) {
        questionnaire_final <-
            questionnaire_final |>
            dplyr::mutate(
                dplyr::across(
                    dplyr::all_of(
                        valid_reverse_items
                    ),
                    ~ 6 - .x
                )
            )
    }

    save_processed_csv(
        questionnaire_final,
        "kuesioner_siswa_clean.csv"
    )

    save_csv_table(
        duplicate_audit,
        "audit_duplikasi_kuesioner_siswa.csv"
    )

    save_csv_table(
        all_one_audit,
        "audit_semua_jawaban_satu_kuesioner_siswa.csv"
    )

    save_csv_table(
        item_mapping,
        "pemetaan_item_kuesioner_siswa.csv"
    )

    list(
        clean = questionnaire_final,
        duplicate_audit = duplicate_audit,
        all_one_audit = all_one_audit,
        item_mapping = item_mapping
    )
}

student_questionnaire <- clean_student_questionnaire(
    STUDENT_QUESTIONNAIRE_FILE,
    reverse_items = REVERSE_ITEMS_STUDENT
)

# ============================================================
# RINGKASAN PEMBERSIHAN DATA
# ============================================================

cleaning_summary <- tibble::tibble(
    data_name = c(
        "Tryout",
        "Kuesioner siswa"
    ),
    total_clean_rows = c(
        nrow(tryout_clean),
        if (is.null(student_questionnaire)) {
            0L
        } else {
            nrow(
                student_questionnaire$clean
            )
        }
    ),
    total_duplicate_records = c(
        nrow(duplicate_position_audit),
        if (is.null(student_questionnaire)) {
            0L
        } else {
            nrow(
                student_questionnaire$
                    duplicate_audit
            )
        }
    ),
    total_all_one_responses = c(
        NA_integer_,
        if (is.null(student_questionnaire)) {
            0L
        } else {
            nrow(
                student_questionnaire$
                    all_one_audit
            )
        }
    )
)

save_csv_table(
    cleaning_summary,
    "ringkasan_pembersihan_data.csv"
)

# ============================================================
# INFORMASI HASIL
# ============================================================

message("")
message("================================================")
message("IMPORT DAN PEMBERSIHAN DATA SELESAI")
message("================================================")
message("")

message(
    "Jumlah baris tryout bersih: ",
    nrow(tryout_clean)
)

message(
    "Jumlah baris dengan log WRS lengkap: ",
    complete_wrs_rows
)

message(
    "Persentase cakupan log WRS: ",
    round(
        wrs_log_availability$
            wrs_log_coverage_percentage[[1]],
        2
    ),
    "%"
)

message(
    "Jumlah sesi tryout: ",
    nrow(session_audit)
)

message(
    "Jumlah sesi tryout lengkap: ",
    sum(
        session_audit$complete_session,
        na.rm = TRUE
    )
)

message(
    "Jumlah sesi tryout tidak lengkap: ",
    sum(
        !session_audit$complete_session,
        na.rm = TRUE
    )
)

message("")

message(
    "Jumlah responden siswa bersih: ",
    if (is.null(student_questionnaire)) {
        0L
    } else {
        nrow(
            student_questionnaire$clean
        )
    }
)

message("")
message(
    "Data ",
    EXCLUDED_STUDENT_NAME,
    " telah dikeluarkan."
)
message(
    "Respons kuesioner ganda mempertahankan isian terakhir."
)
message(
    "Respons dengan seluruh jawaban angka 1 disimpan dalam file audit."
)
message("================================================")
