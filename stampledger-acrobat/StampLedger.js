// ===========================================================================
// StampLedger for Adobe Acrobat - Folder-Level JavaScript Extension
// Version: 1.0.0
//
// Blockchain-verified engineering stamp registry integration for Adobe Acrobat.
// Place this file in your Acrobat JavaScripts folder:
//   Windows: %APPDATA%\Adobe\Acrobat\DC\JavaScripts\
//   macOS:   ~/Library/Application Support/Adobe/Acrobat/DC/JavaScripts/
//
// Copyright (c) 2026 StampLedger. All rights reserved.
// ===========================================================================

(function () {

    // -----------------------------------------------------------------------
    // Configuration
    // -----------------------------------------------------------------------

    var STAMPLEDGER_VERSION = "1.0.0";
    var STAMPLEDGER_API_BASE = "https://portal.stampledger.com";
    var STAMPLEDGER_USER_AGENT = "StampLedger-Acrobat/" + STAMPLEDGER_VERSION;

    // Session state stored in Acrobat globals (persists across documents)
    if (typeof global.stampledgerToken === "undefined") {
        global.stampledgerToken = null;
    }
    if (typeof global.stampledgerApiBase === "undefined") {
        global.stampledgerApiBase = STAMPLEDGER_API_BASE;
    }
    if (typeof global.stampledgerUserName === "undefined") {
        global.stampledgerUserName = "";
    }
    if (typeof global.stampledgerUserEmail === "undefined") {
        global.stampledgerUserEmail = "";
    }
    global.setPersistent("stampledgerToken", false);
    global.setPersistent("stampledgerApiBase", false);
    global.setPersistent("stampledgerUserName", false);
    global.setPersistent("stampledgerUserEmail", false);


    // -----------------------------------------------------------------------
    // Utility: HTTP request wrapper
    // -----------------------------------------------------------------------

    /**
     * Makes an HTTP request using Acrobat's Net.HTTP API.
     *
     * @param {Object} opts
     * @param {string} opts.verb       - HTTP method ("GET", "POST", etc.)
     * @param {string} opts.path       - API path (e.g., "/api/verify/abc123")
     * @param {Object} [opts.body]     - Request body (will be JSON-stringified)
     * @param {boolean} [opts.auth]    - Whether to include Authorization header
     * @param {Function} opts.onSuccess - Callback: function(responseObj)
     * @param {Function} opts.onError   - Callback: function(errorMessage)
     */
    function apiRequest(opts) {
        var verb = opts.verb || "GET";
        var url = global.stampledgerApiBase + opts.path;
        var auth = opts.auth !== false && global.stampledgerToken;
        var onSuccess = opts.onSuccess || function () {};
        var onError = opts.onError || function (msg) { app.alert(msg, 0); };

        var headers = {
            "Accept": "application/json",
            "User-Agent": STAMPLEDGER_USER_AGENT
        };

        if (auth && global.stampledgerToken) {
            headers["Authorization"] = "Bearer " + global.stampledgerToken;
        }

        var requestParams = {
            cVerb: verb,
            cURL: url,
            oHeaders: headers,
            oHandler: {
                response: function (msg, uri, e) {
                    try {
                        if (e && e.statusCode && (e.statusCode < 200 || e.statusCode >= 300)) {
                            var errBody = "";
                            try {
                                var errObj = eval("(" + msg + ")");
                                errBody = errObj.error || errObj.message || ("HTTP " + e.statusCode);
                            } catch (parseErr) {
                                errBody = "HTTP " + e.statusCode;
                            }
                            onError("API Error (" + e.statusCode + "): " + errBody);
                            return;
                        }

                        var responseObj;
                        try {
                            responseObj = eval("(" + msg + ")");
                        } catch (parseErr) {
                            onError("Failed to parse server response.");
                            return;
                        }

                        onSuccess(responseObj);
                    } catch (handlerErr) {
                        onError("Unexpected error: " + handlerErr.toString());
                    }
                }
            }
        };

        if (opts.body) {
            requestParams.cContentType = "application/json";
            requestParams.cBody = JSON.stringify(opts.body);
        }

        try {
            Net.HTTP.request(requestParams);
        } catch (netErr) {
            onError("Network request failed: " + netErr.toString()
                + "\n\nPlease check your internet connection and ensure Acrobat"
                + " has permission to access the network."
                + "\n\nNote: You may need to enable JavaScript network access in"
                + " Edit > Preferences > Security (Enhanced).");
        }
    }


    // -----------------------------------------------------------------------
    // Helper: Check login state
    // -----------------------------------------------------------------------

    function isLoggedIn() {
        return global.stampledgerToken !== null && global.stampledgerToken !== "";
    }

    function requireLogin() {
        if (!isLoggedIn()) {
            app.alert(
                "You must be logged in to StampLedger to use this feature."
                + "\n\nPlease use Edit > StampLedger > Login to StampLedger first.",
                0,
                0,
                "StampLedger - Login Required"
            );
            return false;
        }
        return true;
    }

    function requireDocument() {
        try {
            if (!this || !this.path) {
                app.alert(
                    "No document is currently open."
                    + "\n\nPlease open a PDF document first.",
                    0,
                    0,
                    "StampLedger - No Document"
                );
                return false;
            }
        } catch (e) {
            app.alert(
                "No document is currently open."
                + "\n\nPlease open a PDF document first.",
                0,
                0,
                "StampLedger - No Document"
            );
            return false;
        }
        return true;
    }


    // -----------------------------------------------------------------------
    // Feature: Login
    // -----------------------------------------------------------------------

    var loginDialog = {
        description: {
            name: "StampLedger Login",
            align_children: "align_fill",
            width: 400,
            elements: [
                {
                    type: "cluster",
                    name: "Sign In to StampLedger",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "Email:",
                                    width: 80
                                },
                                {
                                    type: "edit_text",
                                    item_id: "emal",
                                    width: 280,
                                    char_width: 40
                                }
                            ]
                        },
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "Password:",
                                    width: 80
                                },
                                {
                                    type: "edit_text",
                                    item_id: "pass",
                                    width: 280,
                                    char_width: 40,
                                    password: true
                                }
                            ]
                        },
                        {
                            type: "static_text",
                            name: "Your credentials are sent securely to portal.stampledger.com",
                            font: "dialog",
                            height: 20
                        }
                    ]
                },
                {
                    type: "ok_cancel",
                    ok_name: "Login",
                    cancel_name: "Cancel"
                }
            ]
        },
        email: "",
        password: "",
        initialize: function (dialog) {
            dialog.load({
                "emal": this.email,
                "pass": ""
            });
        },
        commit: function (dialog) {
            var results = dialog.store();
            this.email = results["emal"];
            this.password = results["pass"];
        }
    };

    function stampledgerLogin() {
        // If already logged in, offer to log out
        if (isLoggedIn()) {
            var choice = app.alert(
                "You are currently logged in as " + global.stampledgerUserEmail + "."
                + "\n\nWould you like to log out?",
                2,
                2,
                "StampLedger - Already Logged In"
            );
            if (choice === 4) { // "Yes"
                global.stampledgerToken = null;
                global.stampledgerUserName = "";
                global.stampledgerUserEmail = "";
                app.alert(
                    "You have been logged out of StampLedger.",
                    3,
                    0,
                    "StampLedger - Logged Out"
                );
            }
            return;
        }

        var result = app.execDialog(loginDialog);
        if (result !== "ok") {
            return;
        }

        var email = loginDialog.email;
        var password = loginDialog.password;

        if (!email || !password) {
            app.alert(
                "Please enter both email and password.",
                0,
                0,
                "StampLedger - Login Error"
            );
            return;
        }

        // Clear password from dialog object immediately
        loginDialog.password = "";

        apiRequest({
            verb: "POST",
            path: "/api/auth/extension-token",
            body: { email: email, password: password },
            auth: false,
            onSuccess: function (data) {
                if (data.token) {
                    global.stampledgerToken = data.token;
                    global.stampledgerUserName = data.user
                        ? ((data.user.firstName || "") + " " + (data.user.lastName || "")).replace(/^\s+|\s+$/g, "")
                        : "";
                    global.stampledgerUserEmail = data.user ? (data.user.email || email) : email;

                    app.alert(
                        "Login successful!"
                        + (global.stampledgerUserName ? ("\n\nWelcome, " + global.stampledgerUserName + ".") : "")
                        + "\n\nYou can now use StampLedger features from the Edit menu.",
                        3,
                        0,
                        "StampLedger - Login Successful"
                    );
                } else {
                    app.alert(
                        "Login failed: Server did not return an authentication token."
                        + "\n\nPlease try again or contact support.",
                        0,
                        0,
                        "StampLedger - Login Failed"
                    );
                }
            },
            onError: function (msg) {
                app.alert(
                    "Login failed: " + msg
                    + "\n\nPlease check your email and password and try again.",
                    0,
                    0,
                    "StampLedger - Login Failed"
                );
            }
        });
    }


    // -----------------------------------------------------------------------
    // Feature: Verify Document by Stamp ID
    // -----------------------------------------------------------------------

    function stampledgerVerifyDocument() {
        var stampId = app.response({
            cQuestion: "Enter the StampLedger Stamp ID to verify:"
                + "\n\n(This can be found on the stamp annotation or in your StampLedger portal.)",
            cTitle: "StampLedger - Verify Document",
            cDefault: "",
            cLabel: "Stamp ID:"
        });

        if (!stampId || stampId === "null") {
            return;
        }

        stampId = stampId.replace(/^\s+|\s+$/g, "");
        if (!stampId) {
            app.alert(
                "Please enter a valid Stamp ID.",
                0,
                0,
                "StampLedger - Invalid Input"
            );
            return;
        }

        apiRequest({
            verb: "GET",
            path: "/api/verify/" + encodeURIComponent(stampId),
            auth: false,
            onSuccess: function (data) {
                var lines = [];
                lines.push("===== STAMPLEDGER VERIFICATION RESULT =====");
                lines.push("");

                if (data.valid) {
                    lines.push("STATUS: VERIFIED - STAMP IS VALID");
                } else {
                    lines.push("STATUS: " + (data.message || "STAMP IS NOT VALID"));
                }

                lines.push("");

                if (data.stamp) {
                    lines.push("--- Stamp Details ---");
                    lines.push("Stamp ID:        " + data.stamp.id);
                    lines.push("Status:          " + (data.stamp.status || "unknown"));
                    if (data.stamp.projectName) {
                        lines.push("Project:         " + data.stamp.projectName);
                    }
                    if (data.stamp.jurisdictionId) {
                        lines.push("Jurisdiction:    " + data.stamp.jurisdictionId.replace(/-/g, " "));
                    }
                    if (data.stamp.permitNumber) {
                        lines.push("Permit #:        " + data.stamp.permitNumber);
                    }
                    if (data.stamp.createdAt) {
                        lines.push("Stamped Date:    " + data.stamp.createdAt);
                    }
                    if (data.stamp.documentHash) {
                        lines.push("Document Hash:   " + data.stamp.documentHash);
                    }
                    if (data.stamp.documentFilename) {
                        lines.push("Document:        " + data.stamp.documentFilename);
                    }
                    lines.push("");
                }

                if (data.pe) {
                    lines.push("--- Professional Engineer ---");
                    lines.push("Name:            " + (data.pe.name || "N/A"));
                    if (data.pe.license) {
                        lines.push("License:         " + data.pe.license);
                    }
                    if (data.pe.state) {
                        lines.push("State:           " + data.pe.state);
                    }
                    lines.push("");
                }

                if (data.license) {
                    lines.push("--- License Details ---");
                    lines.push("Type:            " + (data.license.type || "N/A"));
                    lines.push("Number:          " + (data.license.number || "N/A"));
                    lines.push("State:           " + (data.license.state || "N/A"));
                    if (data.license.issuingBody) {
                        lines.push("Issuing Body:    " + data.license.issuingBody);
                    }
                    lines.push("Status:          " + (data.license.status || "N/A"));
                    if (data.license.expirationDate) {
                        lines.push("Expires:         " + data.license.expirationDate);
                    }
                    lines.push("");
                }

                if (data.blockchain) {
                    lines.push("--- Blockchain ---");
                    lines.push("On-Chain:        " + (data.blockchain.verified ? "Yes" : "No"));
                    if (data.blockchain.id) {
                        lines.push("Blockchain ID:   " + data.blockchain.id);
                    }
                    if (data.blockchain.txHash) {
                        lines.push("Tx Hash:         " + data.blockchain.txHash);
                    }
                    lines.push("");
                }

                if (data.verification) {
                    lines.push("--- Verification Info ---");
                    lines.push("Total Checks:    " + data.verification.totalVerifications);
                    lines.push("Verified At:     " + data.verification.verifiedAt);
                    lines.push("");
                }

                lines.push("===========================================");
                lines.push("Verification provided by StampLedger");
                lines.push(global.stampledgerApiBase);

                app.alert(
                    lines.join("\n"),
                    3,
                    0,
                    "StampLedger - Verification Result"
                );
            },
            onError: function (msg) {
                if (msg.indexOf("404") !== -1) {
                    app.alert(
                        "Stamp not found."
                        + "\n\nNo stamp exists with ID: " + stampId
                        + "\n\nPlease check the Stamp ID and try again.",
                        1,
                        0,
                        "StampLedger - Not Found"
                    );
                } else {
                    app.alert(
                        "Verification failed: " + msg,
                        0,
                        0,
                        "StampLedger - Verification Error"
                    );
                }
            }
        });
    }


    // -----------------------------------------------------------------------
    // Feature: View Stamp Details (with dialog)
    // -----------------------------------------------------------------------

    var stampDetailDialog = {
        description: {
            name: "StampLedger - Stamp Details",
            align_children: "align_fill",
            width: 520,
            elements: [
                {
                    type: "cluster",
                    name: "Verification Result",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "static_text",
                            item_id: "stat",
                            name: "Loading...",
                            font: "dialog",
                            bold: true,
                            height: 20
                        }
                    ]
                },
                {
                    type: "cluster",
                    name: "Stamp Information",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "static_text",
                            item_id: "info",
                            name: "Fetching stamp details...",
                            multiline: true,
                            height: 280,
                            width: 480
                        }
                    ]
                },
                {
                    type: "ok"
                }
            ]
        },
        statusText: "",
        infoText: "",
        initialize: function (dialog) {
            dialog.load({
                "stat": this.statusText,
                "info": this.infoText
            });
        }
    };

    function stampledgerViewDetails() {
        var stampId = app.response({
            cQuestion: "Enter the StampLedger Stamp ID to look up:",
            cTitle: "StampLedger - View Stamp Details",
            cDefault: "",
            cLabel: "Stamp ID:"
        });

        if (!stampId || stampId === "null") {
            return;
        }

        stampId = stampId.replace(/^\s+|\s+$/g, "");
        if (!stampId) {
            app.alert("Please enter a valid Stamp ID.", 0, 0, "StampLedger");
            return;
        }

        apiRequest({
            verb: "GET",
            path: "/api/verify/" + encodeURIComponent(stampId),
            auth: false,
            onSuccess: function (data) {
                var status = data.valid
                    ? "VERIFIED - This stamp is valid and active."
                    : (data.message || "This stamp is NOT valid.");

                var lines = [];

                if (data.stamp) {
                    lines.push("Stamp ID:           " + data.stamp.id);
                    lines.push("Status:             " + (data.stamp.status || "unknown"));
                    if (data.stamp.projectName) {
                        lines.push("Project:            " + data.stamp.projectName);
                    }
                    if (data.stamp.jurisdictionId) {
                        lines.push("Jurisdiction:       " + data.stamp.jurisdictionId.replace(/-/g, " "));
                    }
                    if (data.stamp.permitNumber) {
                        lines.push("Permit Number:      " + data.stamp.permitNumber);
                    }
                    if (data.stamp.createdAt) {
                        lines.push("Date Stamped:       " + data.stamp.createdAt);
                    }
                    if (data.stamp.documentHash) {
                        lines.push("SHA-256 Hash:       " + data.stamp.documentHash);
                    }
                    if (data.stamp.documentFilename) {
                        lines.push("Filename:           " + data.stamp.documentFilename);
                    }
                    lines.push("");
                }

                if (data.pe) {
                    lines.push("PE Name:            " + (data.pe.name || "N/A"));
                    if (data.pe.license) {
                        lines.push("PE License:         " + data.pe.license);
                    }
                    if (data.pe.state) {
                        lines.push("State:              " + data.pe.state);
                    }
                    lines.push("");
                }

                if (data.license) {
                    lines.push("License Type:       " + (data.license.type || "N/A"));
                    lines.push("License Number:     " + (data.license.number || "N/A"));
                    lines.push("License State:      " + (data.license.state || "N/A"));
                    if (data.license.issuingBody) {
                        lines.push("Issuing Body:       " + data.license.issuingBody);
                    }
                    lines.push("License Status:     " + (data.license.status || "N/A"));
                    if (data.license.expirationDate) {
                        lines.push("Expiration:         " + data.license.expirationDate);
                    }
                    lines.push("");
                }

                if (data.blockchain && data.blockchain.verified) {
                    lines.push("Blockchain:         Verified on-chain");
                    if (data.blockchain.id) {
                        lines.push("Blockchain ID:      " + data.blockchain.id);
                    }
                    if (data.blockchain.txHash) {
                        lines.push("Transaction:        " + data.blockchain.txHash);
                    }
                    lines.push("");
                }

                if (data.stamp && data.stamp.revokedAt) {
                    lines.push("** REVOCATION NOTICE **");
                    lines.push("Revoked:            " + data.stamp.revokedAt);
                    if (data.stamp.revokedReason) {
                        lines.push("Reason:             " + data.stamp.revokedReason);
                    }
                    lines.push("");
                }

                if (data.stamp && data.stamp.notes) {
                    lines.push("Notes:              " + data.stamp.notes);
                }

                stampDetailDialog.statusText = status;
                stampDetailDialog.infoText = lines.join("\n");
                app.execDialog(stampDetailDialog);
            },
            onError: function (msg) {
                if (msg.indexOf("404") !== -1) {
                    app.alert(
                        "No stamp found with ID: " + stampId,
                        1,
                        0,
                        "StampLedger - Not Found"
                    );
                } else {
                    app.alert(
                        "Failed to retrieve stamp details: " + msg,
                        0,
                        0,
                        "StampLedger - Error"
                    );
                }
            }
        });
    }


    // -----------------------------------------------------------------------
    // Feature: Verify Document by SHA-256 Hash
    // -----------------------------------------------------------------------

    function stampledgerVerifyByHash() {
        var hash = app.response({
            cQuestion: "Enter the SHA-256 hash of the document to verify:"
                + "\n\n(You can compute this using a tool like 'certutil -hashfile file.pdf SHA256'"
                + "\non Windows, or 'shasum -a 256 file.pdf' on macOS/Linux.)",
            cTitle: "StampLedger - Verify by Document Hash",
            cDefault: "",
            cLabel: "SHA-256 Hash:"
        });

        if (!hash || hash === "null") {
            return;
        }

        hash = hash.replace(/^\s+|\s+$/g, "").toLowerCase();

        // Basic validation: SHA-256 hashes are 64 hex characters
        if (!/^[a-f0-9]{64}$/.test(hash)) {
            app.alert(
                "Invalid SHA-256 hash format."
                + "\n\nA SHA-256 hash should be exactly 64 hexadecimal characters (0-9, a-f)."
                + "\n\nExample: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                0,
                0,
                "StampLedger - Invalid Hash"
            );
            return;
        }

        apiRequest({
            verb: "POST",
            path: "/api/verify/integrity",
            body: { sha256Hash: hash },
            auth: false,
            onSuccess: function (data) {
                var lines = [];
                lines.push("===== DOCUMENT INTEGRITY CHECK =====");
                lines.push("");
                lines.push("Document Hash: " + hash);
                lines.push("");

                if (data.match && data.stamps && data.stamps.length > 0) {
                    lines.push("RESULT: Document is registered with StampLedger.");
                    lines.push("Active Stamps: " + (data.activeCount || 0));
                    lines.push("Total Stamps:  " + (data.totalCount || 0));
                    lines.push("");

                    for (var i = 0; i < data.stamps.length; i++) {
                        var s = data.stamps[i];
                        lines.push("--- Stamp " + (i + 1) + " ---");
                        lines.push("  ID:         " + s.id);
                        lines.push("  Status:     " + (s.status || "unknown"));
                        if (s.projectName) {
                            lines.push("  Project:    " + s.projectName);
                        }
                        if (s.pe && s.pe.name) {
                            lines.push("  PE:         " + s.pe.name);
                        }
                        if (s.pe && s.pe.license) {
                            lines.push("  License:    " + s.pe.license);
                        }
                        if (s.createdAt) {
                            lines.push("  Date:       " + s.createdAt);
                        }
                        lines.push("");
                    }
                } else {
                    lines.push("RESULT: No stamps found for this document hash.");
                    if (data.document) {
                        lines.push("");
                        lines.push("However, a document record was found:");
                        lines.push("  Title:  " + (data.document.title || "N/A"));
                        lines.push("  Type:   " + (data.document.documentType || "N/A"));
                        lines.push("  Status: " + (data.document.status || "N/A"));
                    }
                }

                lines.push("");
                lines.push((data.message || ""));
                lines.push("");
                lines.push("====================================");

                app.alert(
                    lines.join("\n"),
                    3,
                    0,
                    "StampLedger - Integrity Check Result"
                );
            },
            onError: function (msg) {
                app.alert(
                    "Integrity check failed: " + msg,
                    0,
                    0,
                    "StampLedger - Error"
                );
            }
        });
    }


    // -----------------------------------------------------------------------
    // Feature: Add Stamp Annotation to Current Document
    // -----------------------------------------------------------------------

    var annotationDialog = {
        description: {
            name: "StampLedger - Add Stamp Annotation",
            align_children: "align_fill",
            width: 440,
            elements: [
                {
                    type: "cluster",
                    name: "Stamp Information",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "Stamp ID:",
                                    width: 100
                                },
                                {
                                    type: "edit_text",
                                    item_id: "stid",
                                    width: 300,
                                    char_width: 40
                                }
                            ]
                        },
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "PE Name:",
                                    width: 100
                                },
                                {
                                    type: "edit_text",
                                    item_id: "penm",
                                    width: 300,
                                    char_width: 40
                                }
                            ]
                        },
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "License:",
                                    width: 100
                                },
                                {
                                    type: "edit_text",
                                    item_id: "licn",
                                    width: 300,
                                    char_width: 40
                                }
                            ]
                        },
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "Date:",
                                    width: 100
                                },
                                {
                                    type: "edit_text",
                                    item_id: "date",
                                    width: 300,
                                    char_width: 40
                                }
                            ]
                        },
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "Page:",
                                    width: 100
                                },
                                {
                                    type: "edit_text",
                                    item_id: "page",
                                    width: 80,
                                    char_width: 6
                                },
                                {
                                    type: "static_text",
                                    name: "(current page if blank)"
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "cluster",
                    name: "Position (points from bottom-left)",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "X:",
                                    width: 30
                                },
                                {
                                    type: "edit_text",
                                    item_id: "xpos",
                                    width: 80,
                                    char_width: 8
                                },
                                {
                                    type: "static_text",
                                    name: "  Y:",
                                    width: 30
                                },
                                {
                                    type: "edit_text",
                                    item_id: "ypos",
                                    width: 80,
                                    char_width: 8
                                },
                                {
                                    type: "static_text",
                                    name: "  (default: bottom-right corner)"
                                }
                            ]
                        }
                    ]
                },
                {
                    type: "static_text",
                    name: "Tip: You can auto-fill by first verifying a stamp, or enter details manually.",
                    font: "dialog",
                    height: 20
                },
                {
                    type: "ok_cancel",
                    ok_name: "Add Annotation",
                    cancel_name: "Cancel"
                }
            ]
        },
        stampId: "",
        peName: "",
        license: "",
        dateStr: "",
        pageNum: "",
        xPos: "",
        yPos: "",
        initialize: function (dialog) {
            var now = new Date();
            var dateDefault = this.dateStr || (
                (now.getMonth() + 1) + "/" + now.getDate() + "/" + now.getFullYear()
            );
            dialog.load({
                "stid": this.stampId,
                "penm": this.peName,
                "licn": this.license,
                "date": dateDefault,
                "page": this.pageNum,
                "xpos": this.xPos || "396",
                "ypos": this.yPos || "36"
            });
        },
        commit: function (dialog) {
            var results = dialog.store();
            this.stampId = results["stid"];
            this.peName = results["penm"];
            this.license = results["licn"];
            this.dateStr = results["date"];
            this.pageNum = results["page"];
            this.xPos = results["xpos"];
            this.yPos = results["ypos"];
        }
    };

    function stampledgerAddAnnotation() {
        try {
            var doc = this;
            if (!doc || typeof doc.numPages === "undefined") {
                app.alert(
                    "No document is currently open.\n\nPlease open a PDF first.",
                    0, 0, "StampLedger"
                );
                return;
            }
        } catch (e) {
            app.alert(
                "No document is currently open.\n\nPlease open a PDF first.",
                0, 0, "StampLedger"
            );
            return;
        }

        // Pre-fill with current page
        annotationDialog.pageNum = "";

        var result = app.execDialog(annotationDialog);
        if (result !== "ok") {
            return;
        }

        var stampId = annotationDialog.stampId.replace(/^\s+|\s+$/g, "");
        var peName = annotationDialog.peName.replace(/^\s+|\s+$/g, "");
        var license = annotationDialog.license.replace(/^\s+|\s+$/g, "");
        var dateStr = annotationDialog.dateStr.replace(/^\s+|\s+$/g, "");

        if (!stampId) {
            app.alert(
                "Stamp ID is required to add an annotation.",
                0, 0, "StampLedger"
            );
            return;
        }

        // Determine page number (0-indexed internally)
        var pageIdx;
        var pageInput = annotationDialog.pageNum.replace(/^\s+|\s+$/g, "");
        if (pageInput && !isNaN(parseInt(pageInput, 10))) {
            pageIdx = parseInt(pageInput, 10) - 1; // User enters 1-based
            if (pageIdx < 0) pageIdx = 0;
            if (pageIdx >= doc.numPages) pageIdx = doc.numPages - 1;
        } else {
            pageIdx = this.pageNum || 0;
        }

        // Parse position
        var x = parseFloat(annotationDialog.xPos) || 396;
        var y = parseFloat(annotationDialog.yPos) || 36;

        // Build annotation text
        var annotText = "STAMPLEDGER VERIFIED"
            + "\nStamp ID: " + stampId;
        if (peName) {
            annotText += "\nPE: " + peName;
        }
        if (license) {
            annotText += "\nLicense: " + license;
        }
        if (dateStr) {
            annotText += "\nDate: " + dateStr;
        }
        annotText += "\n\nVerify at: " + global.stampledgerApiBase + "/verify/" + stampId;

        // Annotation dimensions
        var annotWidth = 200;
        var annotHeight = 90;
        if (peName) annotHeight += 14;
        if (license) annotHeight += 14;

        try {
            // Add a stamp-style text annotation
            var annot = doc.addAnnot({
                page: pageIdx,
                type: "FreeText",
                rect: [x, y, x + annotWidth, y + annotHeight],
                contents: annotText,
                author: "StampLedger",
                subject: "StampLedger Verification",
                fillColor: color.white,
                strokeColor: ["RGB", 0.102, 0.227, 0.322],  // #1a3a52
                textColor: ["RGB", 0.102, 0.227, 0.322],
                textFont: "Cour",
                textSize: 8,
                borderEffectStyle: "S",
                width: 2,
                opacity: 0.95,
                readOnly: true,
                noView: false,
                print: true
            });

            app.alert(
                "StampLedger annotation added successfully!"
                + "\n\nPage: " + (pageIdx + 1)
                + "\nStamp ID: " + stampId
                + (peName ? "\nPE: " + peName : "")
                + "\n\nYou can move or resize the annotation as needed."
                + "\nRemember to save the document to preserve the annotation.",
                3,
                0,
                "StampLedger - Annotation Added"
            );
        } catch (annotErr) {
            app.alert(
                "Failed to add annotation: " + annotErr.toString()
                + "\n\nThe document may be read-only or protected."
                + "\nTry saving a local copy first.",
                0,
                0,
                "StampLedger - Annotation Error"
            );
        }
    }


    // -----------------------------------------------------------------------
    // Feature: Quick Verify & Annotate (combined workflow)
    // -----------------------------------------------------------------------

    function stampledgerQuickAnnotate() {
        try {
            var doc = this;
            if (!doc || typeof doc.numPages === "undefined") {
                app.alert(
                    "No document is currently open.\n\nPlease open a PDF first.",
                    0, 0, "StampLedger"
                );
                return;
            }
        } catch (e) {
            app.alert(
                "No document is currently open.\n\nPlease open a PDF first.",
                0, 0, "StampLedger"
            );
            return;
        }

        var stampId = app.response({
            cQuestion: "Enter the Stamp ID to verify and annotate this document with:"
                + "\n\nThis will verify the stamp online and then add an annotation"
                + " to the current page with the verified details.",
            cTitle: "StampLedger - Quick Verify & Annotate",
            cDefault: "",
            cLabel: "Stamp ID:"
        });

        if (!stampId || stampId === "null") {
            return;
        }

        stampId = stampId.replace(/^\s+|\s+$/g, "");
        if (!stampId) {
            return;
        }

        apiRequest({
            verb: "GET",
            path: "/api/verify/" + encodeURIComponent(stampId),
            auth: false,
            onSuccess: function (data) {
                if (!data.stamp) {
                    app.alert(
                        "Stamp data not available in the response.",
                        0, 0, "StampLedger"
                    );
                    return;
                }

                // Pre-fill the annotation dialog
                annotationDialog.stampId = data.stamp.id || stampId;
                annotationDialog.peName = data.pe ? (data.pe.name || "") : "";
                annotationDialog.license = data.pe ? (data.pe.license || "") : "";
                annotationDialog.dateStr = data.stamp.createdAt
                    ? data.stamp.createdAt.substring(0, 10)
                    : "";
                annotationDialog.pageNum = "";

                var statusMsg = data.valid
                    ? "Stamp VERIFIED - details pre-filled below."
                    : "WARNING: Stamp status is '" + (data.stamp.status || "unknown")
                      + "'. Proceed with caution.";

                var proceed = app.alert(
                    statusMsg
                    + "\n\nWould you like to add the annotation to this document?",
                    (data.valid ? 2 : 1),
                    2,
                    "StampLedger - Verification Complete"
                );

                if (proceed === 4) { // Yes
                    stampledgerAddAnnotation.call(doc);
                }
            },
            onError: function (msg) {
                app.alert(
                    "Verification failed: " + msg
                    + "\n\nCannot add annotation without verification.",
                    0, 0, "StampLedger"
                );
            }
        });
    }


    // -----------------------------------------------------------------------
    // Feature: About
    // -----------------------------------------------------------------------

    function stampledgerAbout() {
        var status = isLoggedIn()
            ? "Logged in as: " + global.stampledgerUserEmail
            : "Not logged in";

        app.alert(
            "StampLedger for Adobe Acrobat"
            + "\nVersion " + STAMPLEDGER_VERSION
            + "\n"
            + "\nBlockchain-Verified Engineering Stamp Registry"
            + "\n"
            + "\nAPI Endpoint: " + global.stampledgerApiBase
            + "\nStatus: " + status
            + "\n"
            + "\nFeatures:"
            + "\n  - Verify stamps by Stamp ID"
            + "\n  - Verify documents by SHA-256 hash"
            + "\n  - Add verification annotations to PDFs"
            + "\n  - Quick verify & annotate workflow"
            + "\n"
            + "\nFor full functionality including stamp creation,"
            + "\ndocument upload, and organization management,"
            + "\nvisit the StampLedger web portal:"
            + "\nhttps://portal.stampledger.com"
            + "\n"
            + "\nCopyright (c) 2026 StampLedger."
            + "\nAll rights reserved.",
            3,
            0,
            "About StampLedger"
        );
    }


    // -----------------------------------------------------------------------
    // Feature: Settings
    // -----------------------------------------------------------------------

    var settingsDialog = {
        description: {
            name: "StampLedger Settings",
            align_children: "align_fill",
            width: 460,
            elements: [
                {
                    type: "cluster",
                    name: "API Configuration",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "view",
                            align_children: "align_row",
                            elements: [
                                {
                                    type: "static_text",
                                    name: "API Base URL:",
                                    width: 100
                                },
                                {
                                    type: "edit_text",
                                    item_id: "aurl",
                                    width: 320,
                                    char_width: 50
                                }
                            ]
                        },
                        {
                            type: "static_text",
                            name: "Default: https://portal.stampledger.com",
                            font: "dialog",
                            height: 16
                        }
                    ]
                },
                {
                    type: "cluster",
                    name: "Session",
                    align_children: "align_fill",
                    elements: [
                        {
                            type: "static_text",
                            item_id: "sess",
                            name: "Not logged in",
                            height: 18
                        }
                    ]
                },
                {
                    type: "ok_cancel",
                    ok_name: "Save",
                    cancel_name: "Cancel"
                }
            ]
        },
        initialize: function (dialog) {
            var sessionText = isLoggedIn()
                ? "Logged in as: " + global.stampledgerUserEmail
                : "Not logged in";

            dialog.load({
                "aurl": global.stampledgerApiBase,
                "sess": sessionText
            });
        },
        commit: function (dialog) {
            var results = dialog.store();
            var newUrl = results["aurl"].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (newUrl) {
                global.stampledgerApiBase = newUrl;
            }
        }
    };

    function stampledgerSettings() {
        app.execDialog(settingsDialog);
    }


    // -----------------------------------------------------------------------
    // Menu Registration
    // -----------------------------------------------------------------------

    try {
        // Create the StampLedger submenu under Edit
        app.addSubMenu({
            cName: "StampLedger",
            cParent: "Edit",
            nPos: 0
        });

        // --- Authentication ---

        app.addMenuItem({
            cName: "Login to StampLedger",
            cParent: "StampLedger",
            cExec: "stampledgerLogin()",
            cEnable: "event.rc = true;",
            nPos: 0
        });

        app.addMenuItem({
            cName: "-",
            cParent: "StampLedger",
            nPos: 1
        });

        // --- Verification ---

        app.addMenuItem({
            cName: "Verify Stamp by ID",
            cParent: "StampLedger",
            cExec: "stampledgerVerifyDocument()",
            cEnable: "event.rc = true;",
            nPos: 2
        });

        app.addMenuItem({
            cName: "Verify Document by Hash",
            cParent: "StampLedger",
            cExec: "stampledgerVerifyByHash()",
            cEnable: "event.rc = true;",
            nPos: 3
        });

        app.addMenuItem({
            cName: "View Stamp Details",
            cParent: "StampLedger",
            cExec: "stampledgerViewDetails()",
            cEnable: "event.rc = true;",
            nPos: 4
        });

        app.addMenuItem({
            cName: "-",
            cParent: "StampLedger",
            nPos: 5
        });

        // --- Annotations ---

        app.addMenuItem({
            cName: "Add Stamp Annotation...",
            cParent: "StampLedger",
            cExec: "stampledgerAddAnnotation()",
            cEnable: "event.rc = (app.doc != null);",
            nPos: 6
        });

        app.addMenuItem({
            cName: "Quick Verify & Annotate...",
            cParent: "StampLedger",
            cExec: "stampledgerQuickAnnotate()",
            cEnable: "event.rc = (app.doc != null);",
            nPos: 7
        });

        app.addMenuItem({
            cName: "-",
            cParent: "StampLedger",
            nPos: 8
        });

        // --- Settings & Info ---

        app.addMenuItem({
            cName: "Settings...",
            cParent: "StampLedger",
            cExec: "stampledgerSettings()",
            cEnable: "event.rc = true;",
            nPos: 9
        });

        app.addMenuItem({
            cName: "About StampLedger",
            cParent: "StampLedger",
            cExec: "stampledgerAbout()",
            cEnable: "event.rc = true;",
            nPos: 10
        });

    } catch (menuErr) {
        // Menu registration can fail if menus already exist (e.g., script loaded twice).
        // This is not a critical error.
        console.println("StampLedger: Menu registration note: " + menuErr.toString());
    }


    // -----------------------------------------------------------------------
    // Startup message (console only, not shown to user)
    // -----------------------------------------------------------------------

    console.println("StampLedger for Adobe Acrobat v" + STAMPLEDGER_VERSION + " loaded.");
    console.println("  API endpoint: " + global.stampledgerApiBase);
    console.println("  Access via Edit > StampLedger menu.");

})();
