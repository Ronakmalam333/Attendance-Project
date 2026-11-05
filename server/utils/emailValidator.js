const dns = require("dns").promises;
const { Resolver } = require("dns").promises;

// ============================================================================
// COMPREHENSIVE DISPOSABLE & TEMPORARY EMAIL DOMAINS BLOCKLIST
// ============================================================================
const DISPOSABLE_DOMAINS = new Set([
  // Popular burner & disposable services
  "mailinator.com",
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "10minutemail.co.uk",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.net",
  "tempmailaddress.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "pokemail.net",
  "spam4.me",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "dispostable.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.me",
  "trash-mail.com",
  "getairmail.com",
  "mohmal.com",
  "burnermail.io",
  "dropmail.me",
  "fakemailgenerator.com",
  "crazymailing.com",
  "emailondeck.com",
  "generator.email",
  "inboxkitten.com",
  "throwawaymail.com",
  "nada.ltd",
  "getnada.com",
  "maildrop.cc",
  "mytemp.email",
  "disposablemail.com",
  "fakeinbox.com",
  "mailnesia.com",
  "tempail.com",
  "disposableaddress.com",
  "temporarymail.com",
  "discard.email",
  "discardmail.com",
  "spambog.com",
  "spambog.de",
  "spambog.ru",
  "trashymail.com",
  "anonymbox.com",
  "harakirimail.com",
  "mytempemail.com",
  "meltmail.com",
  "hidemail.de",
  "fastmail.fm",
  "deadaddress.com",
  "nowmymail.com",
  "jetable.org",
  "filzmail.com",
  "noclickemail.com",
  "mailexpire.com",
  "mailcure.com",
  "incognitomail.org",
  "incognitomail.com",
  "mailnull.com",
  "kasmail.com",
  "tempinbox.com",
  "binkmail.com",
  "bobmail.info",
  "chammy.info",
  "devnullmail.com",
  "letthemeatspam.com",
  "mailin8r.com",
  "mailinator2.com",
  "notmailinator.com",
  "reallymymail.com",
  "reconmail.com",
  "safetymail.info",
  "suremail.info",
  "thisisnotmyrealemail.com",
  "tradermail.info",
  "veryrealemail.com",
  "zippymail.info",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "einrot.com",
  "chacuo.net",
  "0-mail.com",
  "0815.ru",
  "0clickemail.com",
  "0wnd.net",
  "0wnd.org",
  "10minutemail.be",
  "10minutemail.cf",
  "10minutemail.de",
  "10minutemail.ga",
  "10minutemail.gq",
  "10minutemail.ml",
  "10minutemail.pl",
  "20minutemail.com",
  "20minutemail.it",
  "30minutemail.com",
  "3d-painting.com",
  "4warding.com",
  "4warding.net",
  "4warding.org",
  "5ymail.com",
  "60minutemail.com",
  "675hosting.com",
  "675hosting.net",
  "675hosting.org",
  "6url.com",
  "75hosting.com",
  "75hosting.net",
  "75hosting.org",
  "7tags.com",
  "9ox.net",
  "a-bc.net",
  "anonbox.net",
  "anonymizer.com",
  "anti-spam.com",
  "antichef.com",
  "antichef.net",
  "antispam.de",
  "baxomale.ht.cx",
  "beefmilk.com",
  "brefmail.com",
  "bsnow.net",
  "bugmenot.com",
  "bupkis.org",
  "cachemail.net",
  "casualdx.com",
  "centermail.com",
  "centermail.net",
  "chogmail.com",
  "clickdeal.org",
  "cool.fr.nf",
  "cosmorph.com",
  "courrieltemporaire.com",
  "cust.in",
  "dacoolest.com",
  "dandikmail.com",
  "deadspam.com",
  "despam.it",
  "despammed.com",
  "digitalsanctuary.com",
  "directmailservice.net",
  "disposable.com",
  "disposableinbox.com",
  "dodgeit.com",
  "dodgit.com",
  "dontextendmylicense.com",
  "dontreg.com",
  "dontsendmespam.de",
  "drdrb.com",
  "dumpmail.de",
  "dumpyemail.com",
  "e-mail.am",
  "e4ward.com",
  "easytrashmail.com",
  "emaildienst.de",
  "emailgo.de",
  "emailias.com",
  "emailmiser.com",
  "emailsensei.com",
  "emailtemporaneo.net",
  "emailto.de",
  "emailx.at.tc",
  "emailx.cx",
  "emeil.in",
  "emeil.ir",
  "ephemail.net",
  "etranquil.com",
  "etranquil.net",
  "etranquil.org",
  "evade.im",
  "fakeinformation.com",
  "fakemail.fr",
  "fastcheetah.com",
  "fastclick.net",
  "freeletter.me",
  "front14.org",
  "fudgebutts.com",
  "fux0ringduh.com",
  "get1mail.com",
  "get2mail.fr",
  "ghosttexter.de",
  "girlsundertheinfluence.com",
  "gishpuppy.com",
  "gowikicars.com",
  "greensloth.com",
  "guerrillamail.info",
  "h.mintemail.com",
  "haltospam.com",
  "hotpop.com",
  "hulapla.de",
  "ieatspam.com",
  "ihateclowns.com",
  "inboxclean.com",
  "inboxproxy.com",
  "incognitomail.net",
  "instant-mail.de",
  "instantemailaddress.com",
  "ipoo.org",
  "irish2me.com",
  "iximail.com",
  "je-te-deteste.com",
  "jetable.com",
  "jopmail.com",
  "junk1e.com",
  "junkmail.com",
  "junkmail.net",
  "junkmailfilter.com",
  "klzlk.com",
  "kurzepost.de",
  "lags.us",
  "landmail.net",
  "lifebyfood.com",
  "link2mail.net",
  "lookugly.com",
  "lortemail.dk",
  "lr78.com",
  "m-a.me",
  "mabox.me",
  "mail-temporaire.fr",
  "mail2rss.org",
  "mail333.com",
  "mail4trash.com",
  "mailbidon.com",
  "mailcatch.com",
  "mailde.de",
  "maildrop.com",
  "maileater.com",
  "mailimate.com",
  "mailin8r.net",
  "mailinator.net",
  "mailinator.org",
  "mailme.ir",
  "mailmetrash.com",
  "mailmoat.com",
  "mailnator.com",
  "mailnesia.net",
  "mailnull.net",
  "mailslite.com",
  "mailtemp.net",
  "mailtome.de",
  "mailtothis.com",
  "mailtrash.net",
  "mailzilla.org",
  "makememail.com",
  "messagebeamer.de",
  "mintemail.com",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "motherearthmail.com",
  "msgbox.info",
  "mycleaninbox.com",
  "mytrashmail.com",
  "neomailbox.com",
  "netmails.net",
  "neverbox.com",
  "nobulk.com",
  "noclickemail.de",
  "nomail.xl.cx",
  "nospam.ze.tc",
  "nospam4.us",
  "nospamfor.us",
  "nospammail.net",
  "notsharingmy.info",
  "nwldx.com",
  "objectmail.com",
  "oneoffemail.com",
  "onewaymail.com",
  "ordinaryamerican.net",
  "otherinbox.com",
  "ourklips.com",
  "pookmail.com",
  "postacin.com",
  "privacy.net",
  "privymail.de",
  "proxymail.eu",
  "prtnx.com",
  "putmail.com",
  "quickinbox.com",
  "rcpt.at",
  "recode.me",
  "refdesk.com",
  "reginbox.com",
  "rmqkr.net",
  "safetymail.net",
  "sandvikens.info",
  "sbcglobal.net.fake",
  "schafmail.de",
  "scryptmail.com",
  "secretemail.org",
  "sharedinbox.com",
  "shiftmail.com",
  "shortmail.net",
  "sogetthis.com",
  "soodonims.com",
  "spamavert.com",
  "spambob.com",
  "spambob.net",
  "spambob.org",
  "spambox.info",
  "spambox.us",
  "spamcan.org",
  "spamcon.org",
  "spamcorptastic.com",
  "spamday.com",
  "spamex.com",
  "spamfree24.org",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "spamhole.com",
  "spamify.com",
  "spaminator.de",
  "spamkill.info",
  "spammotel.com",
  "spamspot.com",
  "spamstack.net",
  "spamtrap.ro",
  "spamtroll.net",
  "speed.1s.fr",
  "superstachel.de",
  "suremail.net",
  "tafmail.com",
  "teewars.org",
  "tempemail.biz",
  "tempemail.co.za",
  "tempemail.com",
  "tempemail.net",
  "tempemail.org",
  "tempinbox.co.uk",
  "tempmailer.com",
  "temporaryemail.net",
  "temporaryforwarding.com",
  "temporaryinbox.com",
  "thanksnospam.info",
  "throwawayemailaddress.com",
  "throwawaymailaddress.com",
  "tilien.com",
  "tinemail.com",
  "tradermail.net",
  "trash-mail.at",
  "trash-mail.de",
  "trash-me.com",
  "trashcanmail.com",
  "trashmail.at",
  "trashmail.de",
  "trashmail.org",
  "trashmailer.com",
  "trsh.org",
  "tvspamboy.de",
  "twinmail.de",
  "upimy.com",
  "urhen.com",
  "veloxmail.com",
  "veryrealemail.net",
  "warimpex.info",
  "wegwerfadresse.de",
  "wegwerfemail.de",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "whyspam.me",
  "willselfdestruct.com",
  "winemaven.info",
  "wrongmail.com",
  "wuzup.net",
  "wuzupmail.net",
  "xents.com",
  "xmaily.com",
  "xoxy.net",
  "yapped.net",
  "yellowjacketdesign.com",
  "ypmail.webredirect.org",
  "yuurok.com",
  "zehnminutenmail.de",
  "zippymail.net",
  "zoemail.org",
]);

// Common domain typos to warn users about
const DOMAIN_TYPOS = {
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmaol.com": "gmail.com",
  "gmal.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaboo.com": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmaill.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlock.com": "outlook.com",
  "icoud.com": "icloud.com",
  "iclud.com": "icloud.com",
};

// Suspicious burner domain keywords
const BURNER_KEYWORD_REGEX = /(?:^|\.)(?:temp|dispos|throwaway|burner|fake|trash|10min|guerrilla|mailinator|yopmail|mohmal|sharklasers)(?:mail|inbox|box)?(?:\.|$)/i;

/**
 * Execute a promise with a strict timeout
 */
function withTimeout(promise, ms, timeoutError) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError || "DNS query timed out")), ms)
    ),
  ]);
}

/**
 * Validates an email address with:
 * 1. Strict RFC syntax and sanity checks
 * 2. Disposable / temporary email domain blocklist & pattern detection
 * 3. Typo detection for major domains
 * 4. DNS MX record resolution with A/AAAA fallback and secondary public DNS recheck
 *
 * @param {string} email - The email address to check
 * @returns {Promise<{ valid: boolean, message?: string, suggestion?: string, domain?: string }>}
 */
async function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "Email address is required." };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Length sanity checks
  if (cleanEmail.length > 254) {
    return { valid: false, message: "Email exceeds maximum allowed length of 254 characters." };
  }

  const atIndex = cleanEmail.lastIndexOf("@");
  if (atIndex === -1 || atIndex === 0 || atIndex === cleanEmail.length - 1) {
    return { valid: false, message: "Email address must contain a valid '@' symbol between username and domain." };
  }

  const localPart = cleanEmail.slice(0, atIndex);
  const domain = cleanEmail.slice(atIndex + 1);

  if (localPart.length > 64) {
    return { valid: false, message: "Email username (local part) exceeds maximum limit of 64 characters." };
  }

  if (domain.length > 253) {
    return { valid: false, message: "Domain name exceeds maximum limit of 253 characters." };
  }

  // 2. Strict syntax check (RFC 5322 compatible)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { valid: false, message: "Email address syntax is invalid. Please check for illegal characters." };
  }

  // Reject consecutive dots or invalid punctuation
  if (localPart.includes("..") || domain.includes("..")) {
    return { valid: false, message: "Email cannot contain consecutive dots ('..')." };
  }

  // Check TLD
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return { valid: false, message: "Email domain must end with a valid top-level domain (e.g. .edu, .com, .org)." };
  }

  // Reject reserved or non-routable top-level domains
  const blockedTlds = new Set(["invalid", "test", "example", "localhost", "local", "internal"]);
  if (blockedTlds.has(tld)) {
    return { valid: false, message: `The top-level domain '.${tld}' is reserved and cannot receive external email.` };
  }

  // 3. Typo detection
  if (DOMAIN_TYPOS[domain]) {
    const suggestion = DOMAIN_TYPOS[domain];
    return {
      valid: false,
      message: `The domain '${domain}' appears to be a typo. Did you mean '${suggestion}'?`,
      suggestion: `${localPart}@${suggestion}`,
      domain,
    };
  }

  // 4. Disposable / Temporary Email Prevention
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      message: "Temporary or disposable email addresses are not permitted. Please use your valid institutional or personal email.",
      domain,
    };
  }

  // Check if any parent subdomain matches disposable domain
  if (domainParts.length > 2) {
    const rootDomain = domainParts.slice(-2).join(".");
    if (DISPOSABLE_DOMAINS.has(rootDomain)) {
      return {
        valid: false,
        message: "Temporary or disposable email providers are prohibited.",
        domain,
      };
    }
  }

  // Pattern detection for burner services
  if (BURNER_KEYWORD_REGEX.test(domain)) {
    return {
      valid: false,
      message: "Temporary or burner email addresses are not allowed on this academic portal.",
      domain,
    };
  }

  // 5. Domain Existence & Mail Server (MX) Verification with Fallback & Recheck
  const dnsResult = await checkDomainMailReadiness(domain);
  if (!dnsResult.valid) {
    return {
      valid: false,
      message: dnsResult.message,
      domain,
    };
  }

  return {
    valid: true,
    email: cleanEmail,
    domain,
  };
}

/**
 * Checks if a domain exists and has active mail servers using:
 * - Primary DNS MX query
 * - Fallback A/AAAA query (RFC 5321 §5.1 implicit MX fallback)
 * - Secondary public DNS recheck (Google 8.8.8.8 / Cloudflare 1.1.1.1)
 *
 * @param {string} domain - Domain name to verify
 * @returns {Promise<{ valid: boolean, message?: string }>}
 */
async function checkDomainMailReadiness(domain) {
  // Allow whitelisted local domains in development if needed
  if (process.env.NODE_ENV === "development" && (domain === "localhost" || domain === "local.dev")) {
    return { valid: true };
  }

  let primaryFailed = false;
  let primaryError = null;

  // --- Step A: Primary MX Check (System Resolver) ---
  try {
    const mxRecords = await withTimeout(dns.resolveMx(domain), 2500, "DNS primary timeout");
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true };
    }
  } catch (err) {
    primaryFailed = true;
    primaryError = err;
  }

  // --- Step B: Primary Fallback - A/AAAA Record (RFC 5321) ---
  if (primaryFailed && primaryError && (primaryError.code === "ENODATA" || primaryError.code === "ENOTFOUND")) {
    try {
      const aRecords = await withTimeout(dns.resolve4(domain), 2000, "A record timeout");
      if (aRecords && aRecords.length > 0) {
        return { valid: true };
      }
    } catch {
      // Both MX and A failed on primary resolver, proceed to recheck
    }
  }

  // --- Step C: Secondary Fallback Recheck (Public Authoritative Resolvers) ---
  // If primary DNS had timeout, ECONNREFUSED, or returned ENOTFOUND,
  // we perform a rigorous recheck using Google (8.8.8.8) and Cloudflare (1.1.1.1).
  try {
    const recheckResolver = new Resolver();
    recheckResolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

    // Recheck MX
    try {
      const recheckMx = await withTimeout(recheckResolver.resolveMx(domain), 3000, "DNS secondary timeout");
      if (recheckMx && recheckMx.length > 0) {
        return { valid: true };
      }
    } catch (recheckMxErr) {
      // If MX doesn't exist, try A record fallback on secondary resolver
      if (recheckMxErr.code === "ENODATA" || recheckMxErr.code === "ENOTFOUND") {
        try {
          const recheckA = await withTimeout(recheckResolver.resolve4(domain), 2500, "Secondary A timeout");
          if (recheckA && recheckA.length > 0) {
            return { valid: true };
          }
        } catch {
          // Both MX and A confirmed absent on secondary public resolver
          return {
            valid: false,
            message: `The domain '${domain}' does not exist or has no active mail servers. Please check for spelling mistakes.`,
          };
        }
      }

      // If secondary also explicitly confirms domain doesn't exist
      if (recheckMxErr.code === "ENOTFOUND") {
        return {
          valid: false,
          message: `The email domain '${domain}' does not exist. Please provide a real email address.`,
        };
      }
    }
  } catch (recheckErr) {
    // If the server itself has zero external internet connectivity (e.g. offline dev environment)
    if (
      recheckErr.code === "ECONNREFUSED" ||
      recheckErr.message?.includes("timeout") ||
      recheckErr.code === "ENETUNREACH" ||
      recheckErr.code === "ESERVFAIL"
    ) {
      console.warn(`[EmailValidator] Network DNS query could not reach external servers (${recheckErr.code || recheckErr.message}). Format & disposable checks passed.`);
      // In airgapped/offline local development, do not completely brick offline developers if syntax & blocklist passed
      return { valid: true };
    }
  }

  return {
    valid: false,
    message: `The email domain '${domain}' could not be verified as an active email provider. Please enter a valid address.`,
  };
}

module.exports = {
  validateEmail,
  checkDomainMailReadiness,
  DISPOSABLE_DOMAINS,
  DOMAIN_TYPOS,
};

