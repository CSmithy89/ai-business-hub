import { IsString, IsDateString, IsOptional, IsBoolean, MinLength, IsEnum } from 'class-validator';
import { CheckpointStatus } from '@prisma/client';

export class CreateCheckpointDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  checkpointDate!: string;

  @IsBoolean()
  @IsOptional()
  remindAt3Days?: boolean;

  @IsBoolean()
  @IsOptional()
  remindAt1Day?: boolean;

  @IsBoolean()
  @IsOptional()
  remindAtDayOf?: boolean;
}

export class UpdateCheckpointDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  checkpointDate?: string;

  @IsEnum(CheckpointStatus)
  @IsOptional()
  status?: CheckpointStatus;
}
