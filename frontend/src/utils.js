// src/utils.js

// A utility function to create URL paths for different pages
export const createPageUrl = (pageName) => {
    switch (pageName) {
        case "Dashboard":
            return "/"; // עמוד הבית הוא לוח המחוונים
        case "Import":
            return "/import";
        case "ManualEntry":
            return "/manual-entry";
        case "MappingConfig":
            return "/mapping-config";
        case "Monthly":
            return "/monthly-report";
        case "Yearly":
            return "/yearly-report";
        default:
            return "/"; // ברירת מחדל
    }
};
