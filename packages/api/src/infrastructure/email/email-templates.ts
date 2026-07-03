import { PETFINDER_LOGO_CID, PETFINDER_ISOTIPO_CID } from "./email-logo-asset";

const ORANGE = "#E8842E";
const NAVY = "#12355B";
const BLUE = "#1D6FA3";
const INK = "#2b2b2b";
const MUTED = "#6b7280";
const CARD = "#ffffff";
const LINE = "#e6e8eb";
const BG = "#eef1f4";
const FONT = "'Nunito', 'Segoe UI', Arial, Helvetica, sans-serif";

export function verificationEmail(appBaseUrl: string, token: string): string {
  const link = `${appBaseUrl}/verify-email?token=${token}`;
  return shell(
    heading("¡Bienvenido a PetFinder!") +
    text("Confirmá tu correo para activar tu cuenta y empezar a usar la app.") +
    buttonRow("Verificar mi cuenta", link) +
    note("Si no creaste esta cuenta, ignorá este correo."));
}

export function passwordResetEmail(appBaseUrl: string, token: string): string {
  const link = `${appBaseUrl}/reset-password?token=${token}`;
  return shell(
    heading("Restablecé tu contraseña") +
    text("Recibimos un pedido para restablecer tu contraseña en PetFinder. Elegí una nueva:") +
    buttonRow("Restablecer mi contraseña", link) +
    note("Si no pediste esto, ignorá este correo."));
}

export function matchAlertEmail(appBaseUrl: string, petName: string, scorePercentage: number, lostReportPublicId: string, imageUrl: string | null): string {
  const link = `${appBaseUrl}/reports/${lostReportPublicId}/matches`;
  return shell(
    petAvatar(imageUrl) +
    heading("¡Posible coincidencia de tu mascota!") +
    scoreBox(scorePercentage, petName) +
    text("Entrá a comparar las fotos lado a lado y decidí si es tu mascota.") +
    buttonRow("Ver la coincidencia", link) +
    note("Es un resultado aproximado de nuestra IA: la decisión final es tuya."));
}

function shell(bodyHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:22px 0;"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${CARD};border:1px solid ${LINE};border-radius:16px;overflow:hidden;">` +
    `<tr><td style="height:6px;background:${ORANGE};font-size:0;line-height:0;">&nbsp;</td></tr>` +
    header() +
    bodyHtml +
    `<tr><td style="padding:22px 32px 28px 32px;border-top:1px solid ${LINE};">` +
    `<p style="margin:0 0 4px 0;font-family:${FONT};font-size:13px;color:${MUTED};">Recibiste este correo porque tenés una cuenta en <strong style="color:${NAVY};">PetFinder</strong>.</p>` +
    `<p style="margin:0;font-family:${FONT};font-size:12px;color:#9aa1aa;">PetFinder · Reuniendo mascotas con sus familias · © 2026</p>` +
    `</td></tr></table></td></tr></table>`;
}

function header(): string {
  return `<tr><td align="center" style="padding:26px 32px 8px 32px;">` +
    `<img src="cid:${PETFINDER_LOGO_CID}" alt="PetFinder" width="190" style="display:block;width:190px;height:auto;border:0;">` +
    `</td></tr>`;
}

function heading(value: string): string {
  return `<tr><td align="center" style="padding:18px 36px 0 36px;"><h1 style="margin:0;font-family:${FONT};font-size:23px;font-weight:800;color:${NAVY};">${value}</h1></td></tr>`;
}

function text(value: string): string {
  return `<tr><td align="center" style="padding:14px 44px 0 44px;"><p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.55;color:${INK};">${value}</p></td></tr>`;
}

function note(value: string): string {
  return `<tr><td align="center" style="padding:6px 44px 26px 44px;"><p style="margin:0;font-family:${FONT};font-size:12.5px;line-height:1.5;color:${MUTED};">${value}</p></td></tr>`;
}

function buttonRow(label: string, href: string): string {
  return `<tr><td align="center" style="padding:20px 32px 4px 32px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto;"><tr>` +
    `<td align="center" bgcolor="${ORANGE}" style="border-radius:10px;">` +
    `<a href="${href}" style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:10px;">${label}</a>` +
    `</td></tr></table></td></tr>`;
}

function petAvatar(imageUrl: string | null): string {
  const inner = imageUrl
    ? `<img src="${imageUrl}" alt="" width="96" height="96" style="display:block;width:96px;height:96px;border-radius:50%;border:3px solid ${ORANGE};object-fit:cover;">`
    : `<img src="cid:${PETFINDER_ISOTIPO_CID}" alt="PetFinder" width="96" height="96" style="display:block;width:96px;height:96px;border-radius:50%;border:3px solid ${ORANGE};background:#ffffff;padding:20px;box-sizing:border-box;">`;
  return `<tr><td align="center" style="padding:10px 32px 0 32px;">${inner}</td></tr>`;
}

function scoreBox(scorePercentage: number, petName: string): string {
  return `<tr><td align="center" style="padding:14px 36px 0 36px;">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" style="background:#f6f9fb;border:1px solid #e3edf4;border-radius:12px;"><tr>` +
    `<td align="center" style="padding:16px 28px;">` +
    `<div style="font-family:${FONT};font-size:40px;font-weight:800;color:${ORANGE};line-height:1;">${scorePercentage}%</div>` +
    `<div style="font-family:${FONT};font-size:14px;color:${BLUE};margin-top:4px;">de coincidencia con <strong style="color:${NAVY};">${petName}</strong></div>` +
    `</td></tr></table></td></tr>`;
}
