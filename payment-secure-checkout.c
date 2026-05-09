#include <stdio.h>
#include <string.h>
#include <time.h>

int isValidCardFormat(char card[]) {
    if (strlen(card) != 16) return 0;
    for (int i = 0; i < 16; i++) {
        if (card[i] < '0' || card[i] > '9') return 0;
    }
    return 1;
}

int luhnCheck(char card[]) {
    int sum = 0;
    int alternate = 0;

    for (int i = strlen(card) - 1; i >= 0; i--) {
        int n = card[i] - '0';

        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }

        sum += n;
        alternate = !alternate;
    }

    return (sum % 10 == 0);
}

int isValidCVC(char cvc[]) {
    if (strlen(cvc) != 3) return 0;
    for (int i = 0; i < 3; i++) {
        if (cvc[i] < '0' || cvc[i] > '9') return 0;
    }
    return 1;
}

int isValidMonth(int month) {
    return (month >= 1 && month <= 12);
}

int isExpired(int month, int year) {
    time_t t = time(NULL);
    struct tm tm = *localtime(&t);

    int currentYear = tm.tm_year + 1900;
    int currentMonth = tm.tm_mon + 1;

    if (year < currentYear) return 1;
    if (year == currentYear && month < currentMonth) return 1;

    return 0;
}

void maskCard(char card[]) {
    int len = strlen(card);
    for (int i = 0; i < len - 4; i++) printf("*");
    printf("%s\n", card + len - 4);
}

int processPayment() {
    char card[20];
    char name[50];
    char cvc[5];
    int month, year;

    printf("Card Number (16 digits): ");
    scanf("%s", card);

    if (!isValidCardFormat(card)) {
        printf("Invalid card number\n");
        return 0;
    }

    printf("Name Surname: ");
    getchar();
    fgets(name, sizeof(name), stdin);

    printf("CVC (3 digits): ");
    scanf("%s", cvc);

    if (!isValidCVC(cvc)) {
        printf("Invalid CVC\n");
        return 0;
    }

    printf("Expiry Date (MM YYYY): ");
    scanf("%d %d", &month, &year);

    if (!isValidMonth(month)) {
        printf("Invalid month\n");
        return 0;
    }

    if (isExpired(month, year)) {
        printf("Card expired\n");
        return 0;
    }

    printf("Processing payment...\n");
    printf("Card: ");
    maskCard(card);

    printf("Payment successful\n");
    return 1;
}

int main() {
    int success = processPayment();

    if (!success) {
        printf("Retrying...\n");
        processPayment();
    }

    return 0;
}