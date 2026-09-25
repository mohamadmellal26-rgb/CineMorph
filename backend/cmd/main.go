package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username,omitempty"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

var db *sql.DB

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	var err error
	db, err = sql.Open("sqlite3", "./database.db")
	if err != nil {
		log.Fatalf("خطأ في الاتصال بقاعدة البيانات: %v", err)
	}

	createTableQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	);`
	_, err = db.Exec(createTableQuery)
	if err != nil {
		log.Fatalf("خطأ في إنشاء الجدول: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/signup", signupHandler)
	mux.HandleFunc("POST /api/login", loginHandler)

	handlerWithCORS := enableCORS(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	serverAddress := ":" + port

	server := &http.Server{
		Addr:         serverAddress,
		Handler:      handlerWithCORS,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	log.Printf("🚀 الخادم يعمل وجاهز على: http://localhost%s\n", serverAddress)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("فشل تشغيل الخادم: %v", err)
	}
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	r.Body = http.MaxBytesReader(w, r.Body, 1024*1024)

	var u User
	if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "بيانات غير صالحة"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "خطأ في معالجة كلمة المرور"})
		return
	}

	_, err = db.Exec("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", u.Username, u.Email, string(hashedPassword))
	if err != nil {
		// طباعة الخطأ الحقيقي في الـ terminal الخاص بالخادم لنكتشف السبب بدقة
		log.Printf("Database Insert Error: %v", err)

		// التحقق بدقة إذا كان الخطأ بسبب تكرار الإيميل فعلاً
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			w.WriteHeader(http.StatusConflict)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "البريد الإلكتروني مستخدم مسبقاً"})
			return
		}

		// إذا كان خطأ آخر في قاعدة البيانات
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "حدث خطأ أثناء حفظ البيانات في قاعدة البيانات"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "تم إنشاء الحساب بنجاح"})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	r.Body = http.MaxBytesReader(w, r.Body, 1024*1024)

	var input User
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "بيانات غير صالحة"})
		return
	}

	var storedUser User
	err := db.QueryRow("SELECT id, username, email, password FROM users WHERE email = ?", input.Email).Scan(&storedUser.ID, &storedUser.Username, &storedUser.Email, &storedUser.Password)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "البريد الإلكتروني أو كلمة المرور غير صحيحة"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(input.Password))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "البريد الإلكتروني أو كلمة المرور غير صحيحة"})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "تم تسجيل الدخول بنجاح"})
}