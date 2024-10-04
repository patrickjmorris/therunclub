import { NextApiRequest, NextApiResponse } from 'next';
import { updatePodcastData } from '../../db';
import cron from 'node-cron';

let isUpdating = false;

// Schedule the update to run every hour
cron.schedule('0 * * * *', async () => {
  if (!isUpdating) {
    isUpdating = true;
    try {
      await updatePodcastData();
      console.log('Podcast data updated successfully');
    } catch (error) {
      console.error('Error updating podcast data:', error);
    } finally {
      isUpdating = false;
    }
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    if (!isUpdating) {
      isUpdating = true;
      try {
        await updatePodcastData();
        res.status(200).json({ message: 'Podcast data updated successfully' });
      } catch (error) {
        console.error('Error updating podcast data:', error);
        res.status(500).json({ message: 'Error updating podcast data' });
      } finally {
        isUpdating = false;
      }
    } else {
      res.status(409).json({ message: 'Update already in progress' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}