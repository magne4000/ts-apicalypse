import type { AxiosPromise } from "axios";
import type {
  Builder,
  BuilderOperator,
  BuilderOperatorNarrow,
  ExecutorMultiMono,
  NamedBuilder,
  Options,
  PipeSub,
  Stringifiable
} from "ts-apicalypse";
import type { proto } from "../proto/compiled";
import type { FallbackIfUnknown } from "ts-apicalypse/dist/types";

export interface Executor<T> {
  execute(options?: Options): AxiosPromise<T[]>
}

export interface ExecutorMulti<T extends Builder<any>[]> {
  execute(options?: Options): AxiosPromise<T extends (infer S)[] ? ExecutorMultiMono<S extends NamedBuilder<any, any> ? S : never>[] : never>
}

export interface Pipe<T> {
  <A>(...steps: (BuilderOperator<T, T> | BuilderOperatorNarrow<T, A>)[]): Stringifiable & Executor<FallbackIfUnknown<A, T>>;
}

export type Sub<T> = <S extends string>(alias: S) => {
  pipe: PipeSub<T, S>;
}

export interface IgdbRequest<K extends keyof Routes> {
  pipe: Pipe<Routes[K]>;
  alias: Sub<Routes[K]>;
}

export interface Routes {
  age_ratings: proto.IAgeRating;
  age_rating_content_descriptions: proto.IAgeRatingContentDescription;
  alternative_names: proto.IAlternativeName;
  artworks: proto.IArtwork;
  characters: proto.ICharacter;
  character_mug_shots: proto.ICharacterMugShot;
  collections: proto.ICollection;
  companies: proto.ICompany;
  company_logos: proto.ICompanyLogo;
  company_websites: proto.ICompanyWebsite;
  covers: proto.ICover;
  external_games: proto.IExternalGame;
  franchises: proto.IFranchise;
  games: proto.IGame;
  game_engines: proto.IGameEngine;
  game_engine_logos: proto.IGameEngineLogo;
  game_modes: proto.IGameMode;
  game_versions: proto.IGameVersion;
  game_version_features: proto.IGameVersionFeature;
  game_version_feature_values: proto.IGameVersionFeatureValue;
  game_videos: proto.IGameVideo;
  genres: proto.IGenre;
  involved_companies: proto.IInvolvedCompany;
  keywords: proto.IKeyword;
  multiplayer_modes: proto.IMultiplayerMode;
  platforms: proto.IPlatform;
  platform_families: proto.IPlatformFamily;
  platform_logos: proto.IPlatformLogo;
  platform_versions: proto.IPlatformVersion;
  platform_version_companies: proto.IPlatformVersionCompany;
  platform_version_release_dates: proto.IPlatformVersionReleaseDate;
  platform_websites: proto.IPlatformWebsite;
  player_perspectives: proto.IPlayerPerspective;
  release_dates: proto.IReleaseDate;
  screenshots: proto.IScreenshot;
  search: proto.ISearch;
  themes: proto.ITheme;
  websites: proto.IWebsite;
}