import axios from "axios";

const accessTokenUri = 'https://id.twitch.tv/oauth2/token';

interface TwitchParams {
  client_id: string,
  client_secret: string,
};

interface TwitchResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export async function twitchAccessToken(params: TwitchParams): Promise<string> {
  const searchParams = new URLSearchParams({
    ...params,
    grant_type: 'client_credentials',
  });
  const url = `${accessTokenUri}?${searchParams}`;

  try {
    const response = await axios.post(url);
    if (response.data) {
      return (response.data as TwitchResponse).access_token;
    }
    throw new Error('No data');
  } catch (error) {
    console.error('Access Token error', error);
    throw error;
  }
}