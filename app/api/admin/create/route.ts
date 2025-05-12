// /pages/api/admin/users/create.ts

import { NextApiRequest, NextApiResponse } from "next"
import { createHospitalUser } from "@/services/hospital-admin-service";

// This will be your API handler for creating a user
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { adminUserId, userData } = req.body;

    try {
      const { user, temporaryPassword, error } = await createHospitalUser(adminUserId, userData);

      if (error) {
        return res.status(400).json({ error });
      }

      // Respond with the created user data and temporary password
      return res.status(200).json({
        user,
        temporaryPassword,
        error: null,
      });
    } catch (error) {
      console.error("Error creating hospital user:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
