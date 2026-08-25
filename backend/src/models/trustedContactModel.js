const { query } = require('../config/db');

// In-memory fallback trusted contacts store
const inMemoryContacts = new Map();

// Helper to seed initial sample trusted contacts
function seedInitialContacts() {
  inMemoryContacts.set(1, {
    id: 1,
    user_id: 3,
    name: 'Sarah Reed (Mother)',
    phone: '+1-555-0188',
    relationship: 'Mother',
    email: 'sarah.reed.mom@example.com',
    is_primary: true,
    created_at: '2026-08-01 10:00:00',
    updated_at: '2026-08-01 10:00:00',
  });

  inMemoryContacts.set(2, {
    id: 2,
    user_id: 3,
    name: 'David Reed (Father)',
    phone: '+1-555-0189',
    relationship: 'Father',
    email: 'david.reed.dad@example.com',
    is_primary: false,
    created_at: '2026-08-02 11:30:00',
    updated_at: '2026-08-02 11:30:00',
  });

  inMemoryContacts.set(3, {
    id: 3,
    user_id: 4,
    name: 'Mikhail Rostov (Brother)',
    phone: '+44-20-7946-0955',
    relationship: 'Brother',
    email: 'mikhail.r@example.com',
    is_primary: true,
    created_at: '2026-08-03 15:00:00',
    updated_at: '2026-08-03 15:00:00',
  });

  inMemoryContacts.set(4, {
    id: 4,
    user_id: 5,
    name: 'Yuki Sato (Spouse)',
    phone: '+81-3-5555-0188',
    relationship: 'Spouse',
    email: 'yuki.sato@example.com',
    is_primary: true,
    created_at: '2026-08-04 12:00:00',
    updated_at: '2026-08-04 12:00:00',
  });
}

seedInitialContacts();

let idSequence = 100;

const trustedContactModel = {
  /**
   * Retrieves all trusted contacts for a given user
   */
  async getByUserId(userId) {
    const numericUserId = parseInt(userId, 10);
    try {
      const [rows] = await query(
        `SELECT id, user_id, name, phone, relationship, email, is_primary, created_at, updated_at
         FROM trusted_contacts
         WHERE user_id = ?
         ORDER BY is_primary DESC, created_at DESC`,
        [numericUserId]
      );
      return rows.map((r) => ({ ...r, is_primary: Boolean(r.is_primary) }));
    } catch (err) {
      // In-memory fallback
      const userContacts = [];
      for (const contact of inMemoryContacts.values()) {
        if (contact.user_id === numericUserId) {
          userContacts.push({ ...contact });
        }
      }
      userContacts.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
      return userContacts;
    }
  },

  /**
   * Retrieves a single contact by ID and validates user ownership
   */
  async getById(id, userId) {
    const contactId = parseInt(id, 10);
    const numericUserId = parseInt(userId, 10);
    try {
      const [rows] = await query(
        `SELECT id, user_id, name, phone, relationship, email, is_primary, created_at, updated_at
         FROM trusted_contacts
         WHERE id = ? AND user_id = ?`,
        [contactId, numericUserId]
      );
      if (rows && rows[0]) {
        return { ...rows[0], is_primary: Boolean(rows[0].is_primary) };
      }
      return null;
    } catch (err) {
      const contact = inMemoryContacts.get(contactId);
      if (contact && contact.user_id === numericUserId) {
        return { ...contact };
      }
      return null;
    }
  },

  /**
   * Creates a new trusted contact for a user
   */
  async create({ userId, name, phone, relationship = 'Family', email = null, isPrimary = false }) {
    const numericUserId = parseInt(userId, 10);
    const primaryFlag = Boolean(isPrimary);
    const cleanEmail = email ? email.trim() : null;

    try {
      if (primaryFlag) {
        // Demote other primary contacts if this is designated primary
        await query(
          `UPDATE trusted_contacts SET is_primary = FALSE WHERE user_id = ?`,
          [numericUserId]
        );
      }

      const [result] = await query(
        `INSERT INTO trusted_contacts (user_id, name, phone, relationship, email, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [numericUserId, name.trim(), phone.trim(), relationship.trim(), cleanEmail, primaryFlag ? 1 : 0]
      );

      return {
        id: result.insertId,
        user_id: numericUserId,
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim(),
        email: cleanEmail,
        is_primary: primaryFlag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      // In-memory fallback
      if (primaryFlag) {
        for (const c of inMemoryContacts.values()) {
          if (c.user_id === numericUserId) {
            c.is_primary = false;
          }
        }
      }

      idSequence++;
      const newContact = {
        id: idSequence,
        user_id: numericUserId,
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship.trim(),
        email: cleanEmail,
        is_primary: primaryFlag,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      inMemoryContacts.set(idSequence, newContact);
      return { ...newContact };
    }
  },

  /**
   * Updates an existing trusted contact
   */
  async update(id, userId, { name, phone, relationship, email, isPrimary }) {
    const contactId = parseInt(id, 10);
    const numericUserId = parseInt(userId, 10);

    try {
      const existing = await this.getById(contactId, numericUserId);
      if (!existing) return null;

      const updatedName = name !== undefined ? name.trim() : existing.name;
      const updatedPhone = phone !== undefined ? phone.trim() : existing.phone;
      const updatedRel = relationship !== undefined ? relationship.trim() : existing.relationship;
      const updatedEmail = email !== undefined ? (email ? email.trim() : null) : existing.email;
      const updatedPrimary = isPrimary !== undefined ? Boolean(isPrimary) : existing.is_primary;

      if (updatedPrimary) {
        await query(
          `UPDATE trusted_contacts SET is_primary = FALSE WHERE user_id = ? AND id != ?`,
          [numericUserId, contactId]
        );
      }

      await query(
        `UPDATE trusted_contacts
         SET name = ?, phone = ?, relationship = ?, email = ?, is_primary = ?
         WHERE id = ? AND user_id = ?`,
        [updatedName, updatedPhone, updatedRel, updatedEmail, updatedPrimary ? 1 : 0, contactId, numericUserId]
      );

      return {
        id: contactId,
        user_id: numericUserId,
        name: updatedName,
        phone: updatedPhone,
        relationship: updatedRel,
        email: updatedEmail,
        is_primary: updatedPrimary,
        updated_at: new Date().toISOString(),
      };
    } catch (err) {
      const existing = inMemoryContacts.get(contactId);
      if (!existing || existing.user_id !== numericUserId) return null;

      const updatedPrimary = isPrimary !== undefined ? Boolean(isPrimary) : existing.is_primary;
      if (updatedPrimary) {
        for (const c of inMemoryContacts.values()) {
          if (c.user_id === numericUserId) {
            c.is_primary = false;
          }
        }
      }

      existing.name = name !== undefined ? name.trim() : existing.name;
      existing.phone = phone !== undefined ? phone.trim() : existing.phone;
      existing.relationship = relationship !== undefined ? relationship.trim() : existing.relationship;
      existing.email = email !== undefined ? (email ? email.trim() : null) : existing.email;
      existing.is_primary = updatedPrimary;
      existing.updated_at = new Date().toISOString();

      return { ...existing };
    }
  },

  /**
   * Deletes a trusted contact
   */
  async delete(id, userId) {
    const contactId = parseInt(id, 10);
    const numericUserId = parseInt(userId, 10);

    try {
      const [result] = await query(
        `DELETE FROM trusted_contacts WHERE id = ? AND user_id = ?`,
        [contactId, numericUserId]
      );
      return result.affectedRows > 0;
    } catch (err) {
      const existing = inMemoryContacts.get(contactId);
      if (existing && existing.user_id === numericUserId) {
        inMemoryContacts.delete(contactId);
        return true;
      }
      return false;
    }
  },
};

module.exports = trustedContactModel;
