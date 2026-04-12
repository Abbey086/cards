<?php
/**
 * Amanda Cards – PHP Email Handler
 * Place this file on your PHP server (e.g. cPanel hosting).
 * Handles: package request emails, contact form submissions, activation notifications.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$ADMIN_EMAIL = 'amandatechnologies@gmail.com';

$action = $_POST['action'] ?? $_GET['action'] ?? '';

switch($action) {

    // ─── Package Request ─────────────────────────────
    case 'package_request':
        $name    = sanitize($_POST['name'] ?? '');
        $email   = sanitize($_POST['email'] ?? '');
        $plan    = sanitize($_POST['plan'] ?? '');
        $phone   = sanitize($_POST['phone'] ?? '');
        $price   = $plan === 'premium' ? '120,000' : '65,000';
        $cards   = $plan === 'premium' ? '2 NFC cards' : '1 NFC card';

        // Email to admin
        $subjectAdmin = "🆕 New Package Request – {$name} ({$plan})";
        $bodyAdmin = "
New package request received!\n
Name:    {$name}
Email:   {$email}
Phone:   {$phone}
Plan:    " . strtoupper($plan) . " – UGX {$price}
Cards:   {$cards}

---
Log in to activate: https://amandacards.co.ug/admin/dashboard.html
        ";
        mail($ADMIN_EMAIL, $subjectAdmin, $bodyAdmin, "From: noreply@amandacards.co.ug\r\nReply-To: {$email}");

        // Confirmation email to user
        $subjectUser = "Amanda Cards – Package Request Received";
        $bodyUser = "
Hi {$name},

Thank you for choosing Amanda Cards!

We've received your {$plan} package request (UGX {$price}).
Our team will contact you at {$phone} within 24 hours to confirm payment and activate your card.

What happens next:
1. We call you to confirm payment
2. We activate your package
3. You set up your digital profile
4. We deliver your NFC card(s)

Questions? Reply to this email or WhatsApp us.

The Amanda Cards Team
amandatechnologies@gmail.com
        ";
        mail($email, $subjectUser, $bodyUser, "From: Amanda Cards <noreply@amandacards.co.ug>");

        echo json_encode(['success' => true, 'message' => 'Package request submitted']);
        break;

    // ─── Contact Form (from profile page) ─────────────
    case 'contact_form':
        $senderName  = sanitize($_POST['sender_name'] ?? '');
        $senderEmail = sanitize($_POST['sender_email'] ?? '');
        $senderPhone = sanitize($_POST['sender_phone'] ?? '—');
        $message     = sanitize($_POST['message'] ?? '');
        $cardOwner   = sanitize($_POST['card_owner'] ?? '');
        $cardEmail   = sanitize($_POST['card_owner_email'] ?? '');
        $cardSlug    = sanitize($_POST['card_slug'] ?? '');

        // Email to card owner
        $subjectOwner = "📬 New message from {$senderName} via your Amanda Card";
        $bodyOwner = "
You have a new message from your digital card!\n
From:    {$senderName}
Email:   {$senderEmail}
Phone:   {$senderPhone}

Message:
{$message}

---
View your dashboard: https://amandacards.co.ug/dashboard.html
        ";
        if ($cardEmail) mail($cardEmail, $subjectOwner, $bodyOwner, "From: Amanda Cards <noreply@amandacards.co.ug>\r\nReply-To: {$senderEmail}");

        // Copy to admin
        $subjectAdmin = "💬 Contact form: {$senderName} → {$cardOwner}";
        mail($ADMIN_EMAIL, $subjectAdmin, $bodyOwner, "From: noreply@amandacards.co.ug");

        echo json_encode(['success' => true, 'message' => 'Message sent']);
        break;

    // ─── Package Activation Notification ──────────────
    case 'send_activation':
        $name      = sanitize($_POST['name'] ?? '');
        $email     = sanitize($_POST['email'] ?? '');
        $plan      = sanitize($_POST['plan'] ?? '');
        $cardUrl   = sanitize($_POST['card_url'] ?? '');

        $subject = "🎉 Your Amanda Card is Now Active!";
        $body = "
Hi {$name},

Great news — your " . strtoupper($plan) . " package is now ACTIVE!

Your digital card is live at:
{$cardUrl}

Next steps:
1. Log in to your dashboard: https://amandacards.co.ug/dashboard.html
2. Set up your profile (logo, phone, bio, socials, services, gallery)
3. Share your card link or QR code and start networking!

⚠️ Important: When setting your phone number, please double-check it before saving.
Your number will be physically printed on your NFC card and cannot be changed without a UGX 20,000 replacement fee.

Welcome to the Amanda Cards family!
The Amanda Cards Team
        ";
        $sent = mail($email, $subject, $body, "From: Amanda Cards <noreply@amandacards.co.ug>");

        echo json_encode(['success' => $sent]);
        break;

    // ─── Track Visit (analytics) ───────────────────────
    case 'track_visit':
        // This would write to Supabase. Here we just log.
        $slug = sanitize($_POST['slug'] ?? '');
        $ref  = sanitize($_POST['ref'] ?? '');
        // In production: insert into Supabase 'visits' table via REST API
        // $supabase_url = 'https://mzokzdbqctnlezngutgb.supabase.co';
        // $key = 'YOUR_SERVICE_ROLE_KEY';
        // ... POST to $supabase_url/rest/v1/visits
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
}

function sanitize($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}
?>
