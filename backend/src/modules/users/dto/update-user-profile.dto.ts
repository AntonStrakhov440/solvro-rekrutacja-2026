import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateProfileDto extends PartialType(
    OmitType(CreateUserDto, ['password', 'email'] as const)
) {}