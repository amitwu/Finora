// A utility function to create URL paths for different pages
export const createPageUrl = (pageName) => {
    switch (pageName) {
        case "Dashboard":
            return "/";
        case "Import":
            return "/import";
        case "ManualEntry":
            return "/manual-entry";
        case "ManualEntry":
            return "/categories";
        case "MappingConfig":
            return "/mapping-config";
        case "Monthly":
            return "/monthly-report";
        case "Yearly":
            return "/yearly-report";
        default:
            return "/";
    }
};
