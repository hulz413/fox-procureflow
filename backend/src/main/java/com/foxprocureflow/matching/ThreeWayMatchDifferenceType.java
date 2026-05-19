package com.foxprocureflow.matching;

public enum ThreeWayMatchDifferenceType {
    MISSING_RECEIPT,
    MISSING_INVOICE,
    RECEIPT_QUANTITY_SHORT,
    INVOICE_QUANTITY_OVER_RECEIPT,
    INVOICE_AMOUNT_MISMATCH
}
